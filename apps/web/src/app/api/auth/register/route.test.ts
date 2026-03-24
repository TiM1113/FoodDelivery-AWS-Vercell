import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

beforeEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  it("forwards registration data to backend and returns success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, role: "user" }),
    );

    const res = await POST(
      makeRequest({ name: "Tim", email: "tim@test.com", password: "pass123456" }),
    );
    const data = await res.json();

    expect(data).toEqual({ success: true, role: "user" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/user/register"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("returns error when email already exists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "User already exists" }), {
        status: 409,
      }),
    );

    const res = await POST(
      makeRequest({ name: "Tim", email: "existing@test.com", password: "pass123456" }),
    );
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toBe("User already exists");
  });

  it("forwards backend validation errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, message: "Password must be at least 8 characters" }),
        { status: 400 },
      ),
    );

    const res = await POST(
      makeRequest({ name: "Tim", email: "tim@test.com", password: "short" }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("returns 503 when backend is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await POST(
      makeRequest({ name: "Tim", email: "tim@test.com", password: "pass123456" }),
    );
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Registration service unavailable");
  });

  it("returns 502 when backend returns non-JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>502 Bad Gateway</html>", {
        status: 502,
        headers: { "Content-Type": "text/html" },
      }),
    );

    const res = await POST(
      makeRequest({ name: "Tim", email: "tim@test.com", password: "pass123456" }),
    );
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid response from server");
  });
});
