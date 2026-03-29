import { beforeEach, describe, expect, it, vi } from "vitest";
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

import { getAdminJwt, adminProxy } from "./admin-api";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_URL = "http://localhost:4000";
  process.env.JWT_SECRET = "test-jwt-secret";
});

function makeRequest(
  url = "http://localhost:3000/api/admin/food/add",
  method = "POST",
): NextRequest {
  return new NextRequest(url, { method });
}

describe("getAdminJwt", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getAdminJwt();
    expect(result).toBeInstanceOf(Response);
    const data = await (result as Response).json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Not authenticated");
  });

  it("returns 403 when user is not admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1", role: "user" } });

    const result = await getAdminJwt();
    expect(result).toBeInstanceOf(Response);
    const data = await (result as Response).json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Admin access required");
  });

  it("returns JWT when user is admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1", role: "admin" } });

    const result = await getAdminJwt();
    expect(result).not.toBeInstanceOf(Response);
    expect((result as { jwt: string }).jwt).toBe("mocked-admin-jwt");
  });
});

describe("adminProxy", () => {
  it("returns 401 for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await adminProxy(makeRequest(), "/api/food/add", {
      body: { name: "test" },
    });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.message).toBe("Not authenticated");
  });

  it("returns 403 for non-admin users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1", role: "user" } });

    const res = await adminProxy(makeRequest(), "/api/food/add", {
      body: { name: "test" },
    });
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.message).toBe("Admin access required");
  });

  it("forwards POST request to backend for admin users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1", role: "admin" } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "Food added" }),
    );

    const res = await adminProxy(makeRequest(), "/api/food/add", {
      body: { name: "Pizza", price: 12 },
    });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/food/add"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Cookie: "token=mocked-admin-jwt",
        }),
      }),
    );
  });

  it("forwards GET request without body", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1", role: "admin" } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: [] }),
    );

    const res = await adminProxy(makeRequest(), "/api/order/list", {
      method: "GET",
    });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/order/list"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
