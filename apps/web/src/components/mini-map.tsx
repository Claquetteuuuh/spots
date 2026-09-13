"use client";

import { useEffect, useRef } from "react";
import type { Map as GLMap } from "maplibre-gl";
import { addMarker, createMap, markerElement } from "@/lib/map-engine";
import { loadStyle, watchMapTheme } from "@/lib/map-tiles";

interface MiniMapProps {
  latitude: number;
  longitude: number;
}

/** The app's pin: a dot in the brand blue, ringed by the page background. */
const PIN_HTML = `<div style="
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  background: var(--color-accent);
  border: 3px solid var(--color-bg);
  border-radius: 9999px;
  box-shadow: 0 1px 4px rgba(22, 32, 58, 0.35);
"></div>`;

/**
 * A small, still map showing a single point. Used on spot detail pages.
 */
export default function MiniMap({ latitude, longitude }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GLMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stopThemeWatch = () => {};

    void createMap({
      container: containerRef.current!,
      center: [longitude, latitude],
      zoom: 15,
      interactive: false,
    }).then(async (map) => {
      if (cancelled) {
        map.remove();
        return;
      }
      mapRef.current = map;
      await addMarker(map, [longitude, latitude], markerElement(PIN_HTML));
      stopThemeWatch = watchMapTheme((dark) => {
        void loadStyle(dark).then((style) => map.setStyle(style as never));
      });
    });

    return () => {
      cancelled = true;
      stopThemeWatch();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The point never changes for a mounted mini map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No minimum height: the parent sizes it (the app's 140px thumb on a phone,
  // the taller strip on desktop), and a forced 160px would clip the thumb.
  return <div ref={containerRef} className="h-full w-full" />;
}
