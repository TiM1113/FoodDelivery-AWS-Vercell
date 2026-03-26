import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
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
    mockGetToken.mockResolvedValue(null);

    const res = await POST(makeRequest({ code: "SAVE10" }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Not authenticated");
  });

  it("returns 401 when token has no id", async () => {
    mockGetToken.mockResolvedValue({ sub: "x" });

    const res = await POST(makeRequest({ code: "SAVE10" }));

    expect(res.status).toBe(401);
  });

  it("forwards request to backend and returns success response", async () => {
    mockGetToken.mockResolvedValue({ id: "user123", sub: "x" });

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
    mockGetToken.mockResolvedValue({ id: "user123", sub: "x" });

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
    mockGetToken.mockResolvedValue({ id: "user123", sub: "x" });

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    const res = await POST(makeRequest({ code: "SAVE10" }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Promo validation service unavailable");
  });
});
