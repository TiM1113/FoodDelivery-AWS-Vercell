"use client";

import { useEffect, useState, type ReactNode } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let initStarted = false;

function loadGoogleMaps(): Promise<void> {
  if (initStarted) return Promise.resolve();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve();

  initStarted = true;
  setOptions({ key: apiKey, libraries: ["places"] });

  return importLibrary("places").then(() => undefined);
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  // Render children immediately — autocomplete degrades gracefully if not ready
  return <>{children}</>;
}
