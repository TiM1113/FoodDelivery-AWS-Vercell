import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockGetToken, mockSign } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockSign: vi.fn().mockResolvedValue("mocked-admin-jwt"),
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

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_URL = "http://localhost:4000";
  process.env.AUTH_SECRET = "test-secret";
  process.env.JWT_SECRET = "test-jwt-secret";
});

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/orders/list", {
    method: "GET",
  });
}

describe("GET /api/admin/orders/list", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetToken.mockResolvedValue(null);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns 403 for non-admin users", async () => {
    mockGetToken.mockResolvedValue({ id: "user1", role: "user" });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.message).toBe("Admin access required");
  });

  it("proxies GET request to backend for admin users", async () => {
    mockGetToken.mockResolvedValue({ id: "admin1", role: "admin" });

    const mockOrders = [
      { _id: "o1", items: [], amount: 25, status: "Food Processing", payment: true },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: mockOrders }),
    );

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockOrders);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/order/list"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
