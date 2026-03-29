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

function makeRequest(body: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/food/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/admin/food/presign", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(JSON.stringify({ fileName: "img.png", fileType: "image/png" })));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns 403 when user is not admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1", role: "user" } });

    const res = await POST(makeRequest(JSON.stringify({ fileName: "img.png", fileType: "image/png" })));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it("proxies presign request to backend for admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1", role: "admin" } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, uploadUrl: "https://s3.example.com/upload", key: "foods/abc.png" }),
    );

    const body = { fileName: "img.png", fileType: "image/png" };
    const res = await POST(makeRequest(JSON.stringify(body)));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.uploadUrl).toBeDefined();

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/food/presign");
  });

  it("returns 400 for invalid JSON body", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1", role: "admin" } });

    const req = new NextRequest("http://localhost:3000/api/admin/food/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe("Invalid JSON");
  });
});
