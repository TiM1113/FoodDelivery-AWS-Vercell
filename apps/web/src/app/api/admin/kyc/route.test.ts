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

import { GET, POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("API_URL", "http://localhost:4000");
  vi.stubEnv("JWT_SECRET", "test-jwt-secret");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function makeRequest(method: "GET" | "POST" = "GET"): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/kyc", { method });
}

describe("GET /api/admin/kyc", () => {
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

  it("forwards status request to backend for admin users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1", role: "admin" } });

    const mockStatus = {
      success: true,
      data: { status: "unverified", sessionId: null },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(mockStatus));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.status).toBe("unverified");

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/kyc/status");
  });
});

describe("POST /api/admin/kyc", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest("POST"));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("forwards create-session request to backend for admin users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1", role: "admin" } });

    const mockSession = {
      success: true,
      data: { sessionId: "vs_123", url: "https://verify.stripe.com/test" },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(mockSession));

    const res = await POST(makeRequest("POST"));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.sessionId).toBe("vs_123");

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/kyc/create-session");
  });
});
