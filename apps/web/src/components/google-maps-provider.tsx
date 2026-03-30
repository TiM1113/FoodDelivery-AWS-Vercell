"use client";

import { useEffect } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let loaded = false;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve();

  setOptions({ key: apiKey, libraries: ["places"] });

  loadPromise = importLibrary("places")
    .then(() => {
      loaded = true;
    })
    .catch(() => {
      // Allow retry on next mount
      loadPromise = null;
    });

  return loadPromise;
}

/**
 * Side-effect component that loads the Google Maps Places library.
 * Renders nothing — mount it when you need Places API available.
 */
export function GoogleMapsProvider() {
  useEffect(() => {
    loadGoogleMaps();
  }, []);

  return null;
}
