import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.stubEnv("API_URL", "http://localhost:4000");
  vi.stubEnv("JWT_SECRET", "test-jwt-secret");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function makeRequest(action: string, body?: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/cart/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : JSON.stringify({}),
  });
}

async function callPOST(action: string, body?: Record<string, unknown>) {
  const { POST } = await import("./route");
  return POST(makeRequest(action, body), {
    params: Promise.resolve({ action }),
  });
}

describe("POST /api/cart/[action]", () => {
  it("returns 400 for invalid action", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });

    const res = await callPOST("invalid");
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid cart action");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await callPOST("add", { itemId: "food1" });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("forwards add request to backend with minted JWT", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, cartData: {} }),
    );

    const res = await callPOST("add", { itemId: "food1" });
    const data = await res.json();

    expect(data.success).toBe(true);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("http://localhost:4000/api/cart/add");

    const headers = fetchCall[1]?.headers as Record<string, string>;
    expect(headers.Cookie).toBe("token=mocked-backend-jwt");

    const forwardedBody = JSON.parse(fetchCall[1]?.body as string);
    expect(forwardedBody.itemId).toBe("food1");
  });

  it("forwards remove request to backend", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    const res = await callPOST("remove", { itemId: "food1" });
    const data = await res.json();

    expect(data.success).toBe(true);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("http://localhost:4000/api/cart/remove");
  });

  it("forwards get request without reading body", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, cartData: { food1: 2 } }),
    );

    const res = await callPOST("get");
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.cartData).toEqual({ food1: 2 });

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("http://localhost:4000/api/cart/get");
  });
});
