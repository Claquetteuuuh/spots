"use client";

import { useEffect, useRef } from "react";
import type { Spot } from "@/lib/api-client";

// Leaflet CSS is loaded via CDN link tag (added dynamically below)

interface SpotMapProps {
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
}

// Default center: Paris
const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 5;

export default function SpotMap({ spots, onSpotClick }: SpotMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Dynamically import Leaflet (client-side only)
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current).setView(
        DEFAULT_CENTER,
        DEFAULT_ZOOM,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      // Add spots
      addMarkers(L, map, spots, onSpotClick);

      // Fit bounds if we have spots
      if (spots.length > 0) {
        const bounds = L.latLngBounds(
          spots.map((s) => [s.latitude, s.longitude] as [number, number]),
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Only initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when spots change
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      // Remove existing markers
      mapRef.current.eachLayer(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (layer: any) => {
          if (layer instanceof L.Marker) {
            mapRef.current.removeLayer(layer);
          }
        },
      );

      addMarkers(L, mapRef.current, spots, onSpotClick);

      if (spots.length > 0) {
        const bounds = L.latLngBounds(
          spots.map((s) => [s.latitude, s.longitude] as [number, number]),
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    });
  }, [spots, onSpotClick]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "400px" }}
    />
  );
}

function addMarkers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  spots: Spot[],
  onSpotClick?: (spot: Spot) => void,
) {
  // Custom icon using design tokens
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

  for (const spot of spots) {
    const marker = L.marker([spot.latitude, spot.longitude], { icon }).addTo(
      map,
    );

    // Popup with photo preview
    const popupContent = `
      <div style="max-width: 200px; font-family: system-ui, sans-serif;">
        <img src="${spot.photoUrl}" alt="" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 2px;" />
        <p style="margin: 6px 0 2px; font-size: 13px; font-weight: 500; color: #1A1A18;">
          ${spot.title ?? "Untitled"}
        </p>
        ${spot.city ? `<p style="margin: 0; font-size: 11px; color: #6B6960;">${spot.city}</p>` : ""}
        <a href="/spot/${spot.id}" style="display: inline-block; margin-top: 6px; font-size: 12px; color: #8B7355; text-decoration: none;">
          View details →
        </a>
      </div>
    `;
    marker.bindPopup(popupContent);

    if (onSpotClick) {
      marker.on("click", () => onSpotClick(spot));
    }
  }
}
