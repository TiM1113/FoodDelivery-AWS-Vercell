import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// API_URL is read at module top level, so we must reset modules between tests
// and use dynamic import to pick up the new env values.

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

async function importFreshModule() {
  const mod = await import("../api");
  return mod.fetchFoodList;
}

describe("fetchFoodList", () => {
  it("throws when API_URL is not configured", async () => {
    vi.stubEnv("API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    const fetchFoodList = await importFreshModule();
    await expect(fetchFoodList()).rejects.toThrow("API_URL is not configured");
  });

  it("fetches food list from API_URL", async () => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const fetchFoodList = await importFreshModule();

    const mockData = { success: true, data: [{ _id: "1", name: "Pizza" }], count: 1, nextCursor: null };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockData),
    );

    const result = await fetchFoodList();

    expect(result).toEqual(mockData);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toContain("/api/food/list");
  });

  it("throws when response is not ok", async () => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const fetchFoodList = await importFreshModule();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    await expect(fetchFoodList()).rejects.toThrow("Failed to fetch food list: 500");
  });

  it("uses NEXT_PUBLIC_API_URL as fallback", async () => {
    vi.stubEnv("API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:5000");

    const fetchFoodList = await importFreshModule();

    const mockData = { success: true, data: [], count: 0, nextCursor: null };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockData),
    );

    const result = await fetchFoodList();
    expect(result).toEqual(mockData);
  });
});
