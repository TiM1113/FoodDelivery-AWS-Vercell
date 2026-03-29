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

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/order/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/order/edit", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        orderId: "abc123",
        items: [],
        amount: 10,
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("forwards edit request to backend with items and amount", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "Order updated" }),
    );

    const body = {
      orderId: "order789",
      items: [{ _id: "f1", name: "Pizza", price: 12, quantity: 2 }],
      amount: 26,
    };

    const res = await POST(makeRequest(body));
    const data = await res.json();

    expect(data.success).toBe(true);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/order/edit");

    const forwardedBody = JSON.parse(fetchCall[1]?.body as string);
    expect(forwardedBody.orderId).toBe("order789");
    expect(forwardedBody.items).toHaveLength(1);
    expect(forwardedBody.amount).toBe(26);
  });
});
