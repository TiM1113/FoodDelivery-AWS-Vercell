import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockAuth, mockSign } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSign: vi.fn().mockResolvedValue("mocked-backend-jwt"),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
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
  vi.stubEnv("API_URL", "http://localhost:4000");
  vi.stubEnv("JWT_SECRET", "test-jwt-secret");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
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
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns 401 when token has no id", async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
  });

  it("forwards request to backend with userId and returns orders", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

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
