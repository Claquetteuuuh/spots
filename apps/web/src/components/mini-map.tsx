"use client";

import { useEffect, useRef } from "react";

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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        map,
      );

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 12px;
          height: 12px;
          background: #8B7355;
          border: 2px solid #FAFAF8;
          border-radius: 2px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
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

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "160px" }}
    />
  );
}
