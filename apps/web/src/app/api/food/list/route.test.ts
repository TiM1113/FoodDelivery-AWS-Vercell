import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.stubEnv("API_URL", "http://localhost:4000");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function makeRequest(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/food/list");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

async function callGET(params?: Record<string, string>) {
  const { GET } = await import("./route");
  return GET(makeRequest(params));
}

describe("GET /api/food/list", () => {
  it("proxies food list from backend", async () => {
    const mockData = { success: true, data: [{ _id: "1", name: "Pizza" }] };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(mockData));

    const res = await callGET();
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe("Pizza");

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe("http://localhost:4000/api/food/list");
  });

  it("forwards query params to backend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, data: [], count: 0 }),
    );

    await callGET({ q: "pizza", category: "Pasta", sortBy: "price_asc" });

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    const url = fetchCall[0] as string;
    expect(url).toContain("q=pizza");
    expect(url).toContain("category=Pasta");
    expect(url).toContain("sortBy=price_asc");
  });

  it("passes through backend error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false, message: "DB error" }),
    );

    const res = await callGET();
    const data = await res.json();

    expect(data.success).toBe(false);
  });
});
