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

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_URL = "http://localhost:4000";
  process.env.AUTH_SECRET = "test-secret";
  process.env.JWT_SECRET = "test-jwt-secret";
});

function makeRequest(body: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/food/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/admin/food/remove", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetToken.mockResolvedValue(null);

    const res = await POST(makeRequest(JSON.stringify({ id: "food1" })));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns 403 when user is not admin", async () => {
    mockGetToken.mockResolvedValue({ id: "user1", role: "user" });

    const res = await POST(makeRequest(JSON.stringify({ id: "food1" })));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it("proxies remove request to backend for admin", async () => {
    mockGetToken.mockResolvedValue({ id: "admin1", role: "admin" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "Food removed" }),
    );

    const res = await POST(makeRequest(JSON.stringify({ id: "food1" })));
    const data = await res.json();

    expect(data.success).toBe(true);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/food/remove");
  });

  it("returns 400 for invalid JSON body", async () => {
    mockGetToken.mockResolvedValue({ id: "admin1", role: "admin" });

    const req = new NextRequest("http://localhost:3000/api/admin/food/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe("Invalid JSON");
  });
});
