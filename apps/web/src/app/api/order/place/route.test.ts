import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted ensures variables exist before vi.mock factory runs
// ---------------------------------------------------------------------------
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

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/order/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/order/place", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ items: [], amount: 0 }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Not authenticated");
  });

  it("returns 401 when token has no id", async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await POST(makeRequest({ items: [], amount: 0 }));

    expect(res.status).toBe(401);
  });

  it("forwards request to backend with userId and returns response", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user123" } });

    const backendResponse = { success: true, session_url: "https://stripe.com/checkout/123" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(backendResponse),
    );

    const body = {
      items: [{ _id: "f1", name: "Pizza", price: 12, quantity: 1 }],
      amount: 14,
      address: { firstName: "John", lastName: "Doe" },
    };

    const res = await POST(makeRequest(body));
    const data = await res.json();

    expect(data).toEqual(backendResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/order/place"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("includes userId in forwarded body", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user456" } });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    await POST(makeRequest({ items: [], amount: 0 }));

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    const forwardedBody = JSON.parse(fetchCall[1]?.body as string);
    expect(forwardedBody.userId).toBe("user456");
  });
});
