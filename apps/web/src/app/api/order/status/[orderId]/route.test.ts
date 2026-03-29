import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted ensures variables exist before vi.mock factory runs
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

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(orderId: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/order/status/${orderId}`,
  );
}

function makeParams(orderId: string) {
  return { params: Promise.resolve({ orderId }) };
}

describe("GET /api/order/status/[orderId]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("order_123"), makeParams("order_123"));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("forwards request to backend and returns payment status", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ payment: true }),
    );

    const res = await GET(makeRequest("order_abc"), makeParams("order_abc"));
    const data = await res.json();

    expect(data).toEqual({ payment: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/order/status/order_abc"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: expect.stringContaining("token="),
        }),
      }),
    );
  });

  it("returns payment=false when order is still pending", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ payment: false }),
    );

    const res = await GET(makeRequest("order_pending"), makeParams("order_pending"));
    const data = await res.json();

    expect(data.payment).toBe(false);
  });
});
