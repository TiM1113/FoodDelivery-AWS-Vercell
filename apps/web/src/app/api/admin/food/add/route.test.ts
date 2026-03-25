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
});

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/food/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/food/add", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetToken.mockResolvedValue(null);

    const res = await POST(makeRequest({ name: "Test" }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns 403 when user is not admin", async () => {
    mockGetToken.mockResolvedValue({ id: "user1", role: "user" });

    const res = await POST(makeRequest({ name: "Test" }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Admin access required");
  });

  it("proxies request to backend for admin users", async () => {
    mockGetToken.mockResolvedValue({ id: "admin1", role: "admin" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "Food added" }),
    );

    const body = { name: "Pizza", description: "Tasty", price: 12, category: "Pasta", imageKey: "img.jpg" };
    const res = await POST(makeRequest(body));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toBe("Food added");

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    const forwardedBody = JSON.parse(fetchCall[1]?.body as string);
    expect(forwardedBody.name).toBe("Pizza");
    expect(forwardedBody.price).toBe(12);
  });
});
