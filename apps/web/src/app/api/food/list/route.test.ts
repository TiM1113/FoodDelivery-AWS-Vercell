import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.stubEnv("API_URL", "http://localhost:4000");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function callGET() {
  const { GET } = await import("./route");
  return GET();
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

  it("passes through backend error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false, message: "DB error" }),
    );

    const res = await callGET();
    const data = await res.json();

    expect(data.success).toBe(false);
  });
});
