import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  AddressAutocomplete,
  type AddressComponents,
} from "@/components/address-autocomplete";

// ---------------------------------------------------------------------------
// Types used in test helpers
// ---------------------------------------------------------------------------
interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// ---------------------------------------------------------------------------
// Hoisted mock variables — vi.hoisted ensures these exist before vi.mock
// factories are executed.
// ---------------------------------------------------------------------------
const {
  mockLoadGoogleMaps,
  mockSetValue,
  mockClearSuggestions,
  mockUsePlacesAutocomplete,
  mockGetGeocode,
} = vi.hoisted(() => {
  const mockSetValue = vi.fn();
  const mockClearSuggestions = vi.fn();
  return {
    mockLoadGoogleMaps: vi.fn(() => Promise.resolve()),
    mockSetValue,
    mockClearSuggestions,
    mockUsePlacesAutocomplete: vi.fn(() => ({
      ready: true,
      suggestions: { status: "", data: [] as PlaceSuggestion[] },
      setValue: mockSetValue,
      clearSuggestions: mockClearSuggestions,
    })),
    mockGetGeocode: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/components/google-maps-provider", () => ({
  loadGoogleMaps: mockLoadGoogleMaps,
}));

vi.mock("use-places-autocomplete", () => ({
  default: mockUsePlacesAutocomplete,
  getGeocode: mockGetGeocode,
}));

interface GeocoderAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocoderResult {
  address_components: GeocoderAddressComponent[];
  formatted_address: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal GeocoderAddressComponent array for standard addresses. */
function buildComponents(
  overrides: Partial<{
    subpremise: string;
    street_number: string;
    route: string;
    locality: string;
    administrative_area_level_1: string;
    postal_code: string;
    country: string;
  }> = {},
): GeocoderAddressComponent[] {
  const map = {
    subpremise: overrides.subpremise,
    street_number: overrides.street_number,
    route: overrides.route,
    locality: overrides.locality,
    administrative_area_level_1: overrides.administrative_area_level_1,
    postal_code: overrides.postal_code,
    country: overrides.country,
  };

  return Object.entries(map)
    .filter(([, v]) => v !== undefined)
    .map(([type, long_name]) => ({
      long_name: long_name as string,
      short_name: long_name as string,
      types: [type],
    }));
}

const STANDARD_SUGGESTION: PlaceSuggestion = {
  place_id: "place-001",
  description: "123 Collins St, Melbourne VIC 3000, Australia",
  structured_formatting: {
    main_text: "123 Collins St",
    secondary_text: "Melbourne VIC 3000, Australia",
  },
};

async function renderComponent(
  props: Partial<{
    id: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    onSelect: (address: AddressComponents) => void;
  }> = {},
) {
  const onChange = props.onChange ?? vi.fn();
  const onSelect = props.onSelect ?? vi.fn();

  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <AddressAutocomplete
        id={props.id}
        value={props.value ?? ""}
        onChange={onChange}
        onSelect={onSelect}
        placeholder={props.placeholder}
      />,
    );
  });
  return result;
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  mockLoadGoogleMaps.mockReturnValue(Promise.resolve());

  // Default: no suggestions
  mockUsePlacesAutocomplete.mockReturnValue({
    ready: true,
    suggestions: { status: "", data: [] },
    setValue: mockSetValue,
    clearSuggestions: mockClearSuggestions,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("AddressAutocomplete", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders input with the default placeholder", async () => {
      await renderComponent();
      expect(
        screen.getByPlaceholderText("Start typing an address…"),
      ).toBeInTheDocument();
    });

    it("renders input with a custom placeholder prop", async () => {
      await renderComponent({ placeholder: "Enter your delivery address" });
      expect(
        screen.getByPlaceholderText("Enter your delivery address"),
      ).toBeInTheDocument();
    });

    it("renders input with the id prop", async () => {
      await renderComponent({ id: "test-id" });
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("id", "test-id");
    });
  });

  // -------------------------------------------------------------------------
  // User interaction
  // -------------------------------------------------------------------------
  describe("user interaction", () => {
    it("calls onChange when the user types", async () => {
      const onChange = vi.fn();
      await renderComponent({ onChange });

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "123 Main" } });

      expect(onChange).toHaveBeenCalledWith("123 Main");
    });

    it("calls onChange with the full typed value via fireEvent", async () => {
      const onChange = vi.fn();
      await renderComponent({ onChange });

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "42 Main St" } });

      expect(onChange).toHaveBeenCalledWith("42 Main St");
    });
  });

  // -------------------------------------------------------------------------
  // Suggestion list visibility
  // -------------------------------------------------------------------------
  describe("suggestion list", () => {
    it("displays the suggestion list when suggestions are available (status OK)", async () => {
      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: {
          status: "OK",
          data: [STANDARD_SUGGESTION],
        },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      await renderComponent();

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByRole("option")).toBeInTheDocument();
      expect(screen.getByText("123 Collins St")).toBeInTheDocument();
    });

    it("hides the suggestion list when there are no suggestions", async () => {
      // Default mock already returns empty suggestions
      await renderComponent();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("hides the suggestion list when status is not OK", async () => {
      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: {
          status: "ZERO_RESULTS",
          data: [],
        },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      await renderComponent();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Maps loading lifecycle
  // -------------------------------------------------------------------------
  describe("maps loading lifecycle", () => {
    it("calls loadGoogleMaps on mount", async () => {
      await renderComponent();
      expect(mockLoadGoogleMaps).toHaveBeenCalledOnce();
    });

    it("mounts the inner component only after maps loads (conditional rendering)", async () => {
      // Simulate delayed resolution so we can observe the loading → ready transition.
      let resolveLoad!: () => void;
      mockLoadGoogleMaps.mockReturnValue(
        new Promise<void>((res) => {
          resolveLoad = res;
        }),
      );

      await renderComponent();

      // Before maps load: inner component is NOT mounted (loading fallback shown)
      expect(mockUsePlacesAutocomplete).toHaveBeenCalledTimes(0);
      expect(
        screen.getByPlaceholderText("Loading address suggestions…"),
      ).toBeInTheDocument();

      // Resolve the promise so mapsLoaded flips to true → inner component mounts
      await act(async () => {
        resolveLoad();
      });

      await waitFor(() => {
        // Inner component mounts once after maps load
        expect(mockUsePlacesAutocomplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Suggestion selection — happy path
  // -------------------------------------------------------------------------
  describe("suggestion selection", () => {
    it("on suggestion click: calls getGeocode, onChange with parsed street, onSelect with parsed components", async () => {
      const onChange = vi.fn();
      const onSelect = vi.fn();

      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: { status: "OK", data: [STANDARD_SUGGESTION] },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      const geocodeResult: GeocoderResult = {
        address_components: buildComponents({
          street_number: "123",
          route: "Collins St",
          locality: "Melbourne",
          administrative_area_level_1: "VIC",
          postal_code: "3000",
          country: "Australia",
        }),
        formatted_address: "123 Collins St, Melbourne VIC 3000, Australia",
      };
      mockGetGeocode.mockResolvedValue([geocodeResult]);

      await renderComponent({ onChange, onSelect });

      const option = screen.getByRole("option");
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockGetGeocode).toHaveBeenCalledWith({
          placeId: STANDARD_SUGGESTION.place_id,
        });
      });

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith({
          street: "123 Collins St",
          city: "Melbourne",
          state: "VIC",
          zipcode: "3000",
          country: "Australia",
        });
      });

      // onChange is called with parsed street (last call after geocode resolves)
      const onChangeCalls = onChange.mock.calls.map(([v]) => v);
      expect(onChangeCalls).toContain("123 Collins St");
    });

    it("on suggestion click with subpremise: street is formatted as subpremise/number route", async () => {
      const onChange = vi.fn();
      const onSelect = vi.fn();

      const subpremiseSuggestion: PlaceSuggestion = {
        place_id: "place-002",
        description: "2/10 Collins St, Melbourne VIC 3000, Australia",
        structured_formatting: {
          main_text: "2/10 Collins St",
          secondary_text: "Melbourne VIC 3000, Australia",
        },
      };

      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: { status: "OK", data: [subpremiseSuggestion] },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      const geocodeResult: GeocoderResult = {
        address_components: buildComponents({
          subpremise: "2",
          street_number: "10",
          route: "Collins St",
          locality: "Melbourne",
          administrative_area_level_1: "VIC",
          postal_code: "3000",
          country: "Australia",
        }),
        formatted_address: "2/10 Collins St, Melbourne VIC 3000, Australia",
      };
      mockGetGeocode.mockResolvedValue([geocodeResult]);

      await renderComponent({ onChange, onSelect });

      fireEvent.click(screen.getByRole("option"));

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(
          expect.objectContaining({ street: "2/10 Collins St" }),
        );
      });
    });

    it("on geocode failure: keeps description text in onChange, onSelect is NOT called", async () => {
      const onChange = vi.fn();
      const onSelect = vi.fn();

      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: { status: "OK", data: [STANDARD_SUGGESTION] },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      mockGetGeocode.mockRejectedValue(new Error("Geocode failed"));

      await renderComponent({ onChange, onSelect });

      fireEvent.click(screen.getByRole("option"));

      // Wait for the async handleSelect to finish (getGeocode rejection is caught)
      await waitFor(() => {
        expect(mockGetGeocode).toHaveBeenCalled();
      });

      // onChange was called synchronously with the description before getGeocode
      expect(onChange).toHaveBeenCalledWith(STANDARD_SUGGESTION.description);

      // onSelect must NOT have been called since geocode failed
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // ARIA attributes
  // -------------------------------------------------------------------------
  describe("ARIA attributes", () => {
    it("has role=combobox on the input", async () => {
      await renderComponent();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("has aria-expanded=false when there are no suggestions", async () => {
      await renderComponent();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("has aria-expanded=true when suggestions are visible", async () => {
      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: { status: "OK", data: [STANDARD_SUGGESTION] },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      await renderComponent();

      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("has aria-controls pointing to the listbox id", async () => {
      await renderComponent();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-controls",
        "address-listbox",
      );
    });

    it("has aria-autocomplete=list", async () => {
      await renderComponent();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-autocomplete",
        "list",
      );
    });
  });
});
