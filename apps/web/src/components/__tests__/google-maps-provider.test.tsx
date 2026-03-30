import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// Static mock so vi.mock hoisting can reference these variables.
const mockSetOptions = vi.fn();
const mockImportLibrary = vi.fn();

vi.mock("@googlemaps/js-api-loader", () => ({
  setOptions: mockSetOptions,
  importLibrary: mockImportLibrary,
}));

// Helper: re-import the module with a clean module registry so the top-level
// `loaded` and `loadPromise` variables are reset to their initial values for
// each test.
async function freshModule() {
  vi.resetModules();
  // Re-apply the mock after resetModules wipes the registry.
  vi.mock("@googlemaps/js-api-loader", () => ({
    setOptions: mockSetOptions,
    importLibrary: mockImportLibrary,
  }));
  return import("@/components/google-maps-provider");
}

beforeEach(() => {
  vi.resetModules();
  mockSetOptions.mockReset();
  mockImportLibrary.mockReset();
  // Remove the env var between tests; individual tests set it when needed.
  delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
});

describe("loadGoogleMaps", () => {
  it("returns a resolved promise immediately when no API key is set", async () => {
    const { loadGoogleMaps } = await freshModule();

    await expect(loadGoogleMaps()).resolves.toBeUndefined();
    expect(mockSetOptions).not.toHaveBeenCalled();
    expect(mockImportLibrary).not.toHaveBeenCalled();
  });

  it("calls setOptions and importLibrary with correct arguments when API key is present", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";
    mockImportLibrary.mockResolvedValueOnce({});

    const { loadGoogleMaps } = await freshModule();
    await loadGoogleMaps();

    expect(mockSetOptions).toHaveBeenCalledOnce();
    expect(mockSetOptions).toHaveBeenCalledWith({
      key: "test-api-key",
      libraries: ["places"],
    });
    expect(mockImportLibrary).toHaveBeenCalledOnce();
    expect(mockImportLibrary).toHaveBeenCalledWith("places");
  });

  it("deduplicates concurrent calls - importLibrary is invoked only once", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";

    let resolveImport!: () => void;
    const pendingPromise = new Promise<object>((res) => {
      resolveImport = () => res({});
    });
    mockImportLibrary.mockReturnValueOnce(pendingPromise);

    const { loadGoogleMaps } = await freshModule();

    // Fire two calls before the first one resolves.
    const p1 = loadGoogleMaps();
    const p2 = loadGoogleMaps();

    resolveImport();
    await Promise.all([p1, p2]);

    expect(mockImportLibrary).toHaveBeenCalledOnce();
  });

  it("resets loadPromise on failure so a subsequent call can retry", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";

    mockImportLibrary
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({});

    const { loadGoogleMaps } = await freshModule();

    // First call fails; the promise should settle (reject swallowed internally).
    const firstCall = loadGoogleMaps();
    await expect(firstCall).resolves.toBeUndefined();

    // After failure loadPromise is null, so a second call must invoke
    // importLibrary again.
    await loadGoogleMaps();

    expect(mockImportLibrary).toHaveBeenCalledTimes(2);
  });
});

describe("GoogleMapsProvider", () => {
  it("renders null (produces no DOM output)", async () => {
    const { GoogleMapsProvider } = await freshModule();
    const { container } = render(<GoogleMapsProvider />);

    expect(container.innerHTML).toBe("");
  });

  it("calls loadGoogleMaps on mount via useEffect", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";
    mockImportLibrary.mockResolvedValueOnce({});

    const { GoogleMapsProvider } = await freshModule();
    render(<GoogleMapsProvider />);

    // importLibrary is called inside the effect triggered on mount.
    expect(mockImportLibrary).toHaveBeenCalledOnce();
    expect(mockImportLibrary).toHaveBeenCalledWith("places");
  });
});
