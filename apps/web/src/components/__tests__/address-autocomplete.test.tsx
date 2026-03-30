import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function renderComponent(
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

  return render(
    <AddressAutocomplete
      id={props.id}
      value={props.value ?? ""}
      onChange={onChange}
      onSelect={onSelect}
      placeholder={props.placeholder}
    />,
  );
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
    it("renders input with the default placeholder", () => {
      renderComponent();
      expect(
        screen.getByPlaceholderText("Start typing an address…"),
      ).toBeInTheDocument();
    });

    it("renders input with a custom placeholder prop", () => {
      renderComponent({ placeholder: "Enter your delivery address" });
      expect(
        screen.getByPlaceholderText("Enter your delivery address"),
      ).toBeInTheDocument();
    });

    it("renders input with the id prop", () => {
      renderComponent({ id: "test-id" });
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("id", "test-id");
    });
  });

  // -------------------------------------------------------------------------
  // User interaction
  // -------------------------------------------------------------------------
  describe("user interaction", () => {
    it("calls onChange when the user types", () => {
      const onChange = vi.fn();
      renderComponent({ onChange });

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "123 Main" } });

      expect(onChange).toHaveBeenCalledWith("123 Main");
    });

    it("calls onChange with the full typed value via fireEvent", () => {
      const onChange = vi.fn();
      renderComponent({ onChange });

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "42 Main St" } });

      expect(onChange).toHaveBeenCalledWith("42 Main St");
    });
  });

  // -------------------------------------------------------------------------
  // Suggestion list visibility
  // -------------------------------------------------------------------------
  describe("suggestion list", () => {
    it("displays the suggestion list when suggestions are available (status OK)", () => {
      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: {
          status: "OK",
          data: [STANDARD_SUGGESTION],
        },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      renderComponent();

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByRole("option")).toBeInTheDocument();
      expect(screen.getByText("123 Collins St")).toBeInTheDocument();
    });

    it("hides the suggestion list when there are no suggestions", () => {
      // Default mock already returns empty suggestions
      renderComponent();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("hides the suggestion list when status is not OK", () => {
      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: {
          status: "ZERO_RESULTS",
          data: [],
        },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      renderComponent();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Maps loading lifecycle
  // -------------------------------------------------------------------------
  describe("maps loading lifecycle", () => {
    it("calls loadGoogleMaps on mount", () => {
      renderComponent();
      expect(mockLoadGoogleMaps).toHaveBeenCalledOnce();
    });

    it("re-mounts the inner component when maps loads (usePlacesAutocomplete called twice)", async () => {
      // Simulate delayed resolution so we can observe both renders:
      // key="false" (before) and key="true" (after).
      let resolveLoad!: () => void;
      mockLoadGoogleMaps.mockReturnValue(
        new Promise<void>((res) => {
          resolveLoad = res;
        }),
      );

      renderComponent();

      // After initial render, inner component mounted once → 1 call
      expect(mockUsePlacesAutocomplete).toHaveBeenCalledTimes(1);

      // Resolve the promise so state flips from false → true, triggering re-mount
      resolveLoad();

      await waitFor(() => {
        // Inner component unmounts + remounts → total 2 calls
        expect(mockUsePlacesAutocomplete).toHaveBeenCalledTimes(2);
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

      renderComponent({ onChange, onSelect });

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

      renderComponent({ onChange, onSelect });

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

      renderComponent({ onChange, onSelect });

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
    it("has role=combobox on the input", () => {
      renderComponent();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("has aria-expanded=false when there are no suggestions", () => {
      renderComponent();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("has aria-expanded=true when suggestions are visible", () => {
      mockUsePlacesAutocomplete.mockReturnValue({
        ready: true,
        suggestions: { status: "OK", data: [STANDARD_SUGGESTION] },
        setValue: mockSetValue,
        clearSuggestions: mockClearSuggestions,
      });

      renderComponent();

      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("has aria-controls pointing to the listbox id", () => {
      renderComponent();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-controls",
        "address-listbox",
      );
    });

    it("has aria-autocomplete=list", () => {
      renderComponent();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-autocomplete",
        "list",
      );
    });
  });
});
