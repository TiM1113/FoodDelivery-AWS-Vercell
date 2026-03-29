import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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

import { GET, PUT } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/user/profile", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/user/profile");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("forwards profile data from backend", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

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
    mockAuth.mockResolvedValue({ user: { id: "user123" } });
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
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane" }),
    });
    const res = await PUT(req);

    expect(res.status).toBe(401);
  });

  it("forwards name update to backend", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

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
