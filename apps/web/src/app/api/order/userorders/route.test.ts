import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockGetToken, mockSign } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockSign: vi.fn().mockResolvedValue("mocked-backend-jwt"),
}));

vi.mock("next-auth/jwt", () => ({ getToken: mockGetToken }));
vi.mock("jose", () => ({
  SignJWT: function SignJWT() {
    return {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      sign: mockSign,
    };
  },
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/order/userorders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

describe("POST /api/order/userorders", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetToken.mockResolvedValue(null);

    const res = await POST(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns 401 when token has no id", async () => {
    mockGetToken.mockResolvedValue({ sub: "x" });

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
  });

  it("forwards request to backend with userId and returns orders", async () => {
    mockGetToken.mockResolvedValue({ id: "user123", sub: "x" });

    const mockOrders = [
      { _id: "order1", amount: 25, status: "Delivered", payment: true },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: mockOrders }),
    );

    const res = await POST(makeRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockOrders);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/order/userorders");

    const forwardedBody = JSON.parse(fetchCall[1]?.body as string);
    expect(forwardedBody.userId).toBe("user123");
  });
});
