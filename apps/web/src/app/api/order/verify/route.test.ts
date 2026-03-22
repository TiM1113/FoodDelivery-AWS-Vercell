import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

beforeEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(success: string, orderId: string): NextRequest {
  const url = `http://localhost:3000/api/order/verify?success=${success}&orderId=${orderId}`;
  return new NextRequest(url);
}

describe("GET /api/order/verify", () => {
  it("forwards success and orderId to backend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, payment: true }),
    );

    const res = await GET(makeRequest("true", "order_abc"));
    const data = await res.json();

    expect(data).toEqual({ success: true, payment: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("success=true&orderId=order_abc"),
    );
  });

  it("forwards cancellation (success=false) to backend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "Order deleted" }),
    );

    const res = await GET(makeRequest("false", "order_xyz"));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("success=false&orderId=order_xyz"),
    );
  });

  it("handles missing query params gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false }),
    );

    const req = new NextRequest("http://localhost:3000/api/order/verify");
    const res = await GET(req);
    const data = await res.json();

    expect(data.success).toBe(false);
    // Should still call backend with empty strings
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("success=&orderId="),
    );
  });
});
