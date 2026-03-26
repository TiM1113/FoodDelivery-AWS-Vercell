import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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

import { GET, PUT } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/user/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetToken.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/user/profile");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("forwards profile data from backend", async () => {
    mockGetToken.mockResolvedValue({ id: "user123", sub: "x" });

    const backendResponse = {
      success: true,
      data: { id: "user123", name: "John", email: "john@example.com" },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(backendResponse),
    );

    const req = new NextRequest("http://localhost:3000/api/user/profile");
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.name).toBe("John");
  });

  it("returns 502 on network error", async () => {
    mockGetToken.mockResolvedValue({ id: "user123", sub: "x" });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Connection refused"),
    );

    const req = new NextRequest("http://localhost:3000/api/user/profile");
    const res = await GET(req);

    expect(res.status).toBe(502);
  });
});

describe("PUT /api/user/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetToken.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane" }),
    });
    const res = await PUT(req);

    expect(res.status).toBe(401);
  });

  it("forwards name update to backend", async () => {
    mockGetToken.mockResolvedValue({ id: "user123", sub: "x" });

    const backendResponse = {
      success: true,
      data: { id: "user123", name: "Jane", email: "jane@example.com" },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(backendResponse),
    );

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane" }),
    });
    const res = await PUT(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Jane");
  });
});
