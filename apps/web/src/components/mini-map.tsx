"use client";

import { useEffect, useRef } from "react";
import { addBasemap } from "@/lib/map-tiles";

interface MiniMapProps {
  latitude: number;
  longitude: number;
}

/**
 * A small, non-interactive map showing a single point.
 * Used on spot detail pages.
 */
export default function MiniMap({ latitude, longitude }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).setView([latitude, longitude], 14);

      addBasemap(L, map);

      // The app's pin: a 14px accent dot ringed in the page background. Theme
      // variables rather than hex so it follows dark mode like the main map.
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 14px;
          height: 14px;
          box-sizing: border-box;
          background: var(--color-accent);
          border: 2px solid var(--color-bg);
          border-radius: 50%;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([latitude, longitude], { icon, interactive: false }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No minimum height: the parent sizes it (the app's 140px thumb on a phone,
  // the taller strip on desktop), and a forced 160px would clip the thumb.
  return <div ref={containerRef} className="h-full w-full" />;
}
