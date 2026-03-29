import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockAuth, mockSign } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSign: vi.fn().mockResolvedValue("mocked-admin-jwt"),
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
  vi.stubEnv("API_URL", "http://localhost:4000");
  vi.stubEnv("JWT_SECRET", "test-jwt-secret");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/stats", {
    method: "GET",
  });
}

describe("GET /api/admin/stats", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns 403 for non-admin users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123", role: "user" } });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.message).toBe("Admin access required");
  });

  it("forwards stats request to backend for admin users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1", role: "admin" } });

    const mockStats = {
      success: true,
      data: { totalRevenue: 100, totalOrders: 5 },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(mockStats));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.totalRevenue).toBe(100);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/order/stats");
  });
});
