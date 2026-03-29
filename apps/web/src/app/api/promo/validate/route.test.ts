import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
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
});

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/promo/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/promo/validate", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ code: "SAVE10" }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Not authenticated");
  });

  it("returns 401 when token has no id", async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await POST(makeRequest({ code: "SAVE10" }));

    expect(res.status).toBe(401);
  });

  it("forwards request to backend and returns success response", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

    const backendResponse = {
      success: true,
      promoId: "promo_123",
      coupon: { percentOff: 10, amountOff: null, currency: null, name: "10% Off" },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(backendResponse),
    );

    const res = await POST(makeRequest({ code: "SAVE10" }));
    const data = await res.json();

    expect(data).toEqual(backendResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/order/validate-promo"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("forwards invalid promo response from backend", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

    const backendResponse = {
      success: false,
      message: "Invalid or expired promo code",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(backendResponse),
    );

    const res = await POST(makeRequest({ code: "EXPIRED" }));
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid or expired promo code");
  });

  it("returns 502 on network error", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    const res = await POST(makeRequest({ code: "SAVE10" }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Promo validation service unavailable");
  });
});
