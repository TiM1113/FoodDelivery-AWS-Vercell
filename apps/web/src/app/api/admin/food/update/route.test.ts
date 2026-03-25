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

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/food/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/food/update", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetToken.mockResolvedValue(null);

    const res = await POST(makeRequest({ id: "food1", name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    mockGetToken.mockResolvedValue({ id: "user1", role: "user" });

    const res = await POST(makeRequest({ id: "food1", name: "Test" }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.message).toBe("Admin access required");
  });

  it("returns 400 for invalid JSON", async () => {
    mockGetToken.mockResolvedValue({ id: "admin1", role: "admin" });

    const req = new NextRequest("http://localhost:3000/api/admin/food/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe("Invalid JSON");
  });

  it("proxies update request to backend for admin", async () => {
    mockGetToken.mockResolvedValue({ id: "admin1", role: "admin" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "Food updated" }),
    );

    const body = {
      id: "food1",
      name: "Updated Pizza",
      description: "Updated description",
      price: 15,
      category: "Pasta",
    };
    const res = await POST(makeRequest(body));
    const data = await res.json();

    expect(data.success).toBe(true);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/food/update");
    const forwardedBody = JSON.parse(fetchCall[1]?.body as string);
    expect(forwardedBody.name).toBe("Updated Pizza");
  });
});
