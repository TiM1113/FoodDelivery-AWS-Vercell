"use client";

import { useEffect, useRef } from "react";
import usePlacesAutocomplete, { getGeocode } from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: AddressComponents) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[],
  formattedAddress: string,
): AddressComponents {
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? "";
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.short_name ?? "";

  const streetNumber = get("street_number");
  const route = get("route");
  const subpremise = get("subpremise");

  let street = "";
  if (subpremise && streetNumber) {
    street = `${subpremise}/${streetNumber} ${route}`;
  } else if (streetNumber) {
    street = `${streetNumber} ${route}`;
  } else if (route) {
    street = route;
  } else {
    // Fallback: extract street from formatted address (first segment before comma)
    const firstSegment = formattedAddress.split(",")[0]?.trim() ?? "";
    street = firstSegment;
  }

  return {
    street,
    city: get("locality") || get("sublocality") || get("postal_town"),
    state: getShort("administrative_area_level_1"),
    zipcode: get("postal_code"),
    country: get("country"),
  };
}

export function AddressAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address…",
  disabled = false,
  className,
}: AddressAutocompleteProps) {
  const listRef = useRef<HTMLUListElement>(null);

  const {
    ready,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ["address"],
    },
    debounce: 300,
  });

  // Sync external value with internal state (for edit mode)
  useEffect(() => {
    setValue(value, false);
  }, [value, setValue]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    onChange(val);
  };

  const handleSelect = async (description: string, placeId: string) => {
    setValue(description, false);
    clearSuggestions();
    onChange(description);

    try {
      const results = await getGeocode({ placeId });
      if (results[0]) {
        const parsed = parseAddressComponents(
          results[0].address_components,
          results[0].formatted_address,
        );
        // Update the street field with the parsed street (not full formatted address)
        onChange(parsed.street);
        setValue(parsed.street, false);
        onSelect(parsed);
      }
    } catch {
      // Geocode failed — keep the typed text, user can fill manually
    }
  };

  const hasSuggestions = status === "OK" && data.length > 0;

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleInput}
        disabled={disabled}
        placeholder={ready ? placeholder : placeholder}
        className={cn(className)}
        autoComplete="off"
        role="combobox"
        aria-expanded={hasSuggestions}
        aria-controls="address-listbox"
        aria-autocomplete="list"
      />

      {hasSuggestions && (
        <ul
          ref={listRef}
          id="address-listbox"
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              role="option"
              aria-selected={false}
              className="cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() =>
                handleSelect(suggestion.description, suggestion.place_id)
              }
            >
              <span className="font-medium">
                {suggestion.structured_formatting.main_text}
              </span>
              <span className="ml-1 text-muted-foreground">
                {suggestion.structured_formatting.secondary_text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
