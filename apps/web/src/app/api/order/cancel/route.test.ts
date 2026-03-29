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
  return new NextRequest("http://localhost:3000/api/order/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/order/cancel", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ orderId: "abc123" }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("forwards cancel request to backend and returns response", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "Order cancelled", refundId: null }),
    );

    const res = await POST(makeRequest({ orderId: "order456" }));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toBe("Order cancelled");

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/order/cancel");

    const forwardedBody = JSON.parse(fetchCall[1]?.body as string);
    expect(forwardedBody.orderId).toBe("order456");
  });

  it("returns refundId when paid order is cancelled", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        message: "Order cancelled and refund initiated",
        refundId: "re_abc123",
      }),
    );

    const res = await POST(makeRequest({ orderId: "order789" }));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.refundId).toBe("re_abc123");
  });

  it("returns 500 when env vars are missing", async () => {
    vi.stubEnv("API_URL", "");

    const res = await POST(makeRequest({ orderId: "order456" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.message).toBe("Server configuration error");
  });
});
