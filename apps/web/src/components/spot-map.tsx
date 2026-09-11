"use client";

import { useEffect, useRef } from "react";
import type { Spot } from "@/lib/api-client";

interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

/**
 * A place to move the map to. Pass a fresh object each time — the map
 * re-centres on every new one, so "locate me" answers even when the
 * photographer hasn't moved.
 */
interface MapCenter {
  lat: number;
  lng: number;
  zoom?: number;
}

interface SpotMapProps {
  spots: Spot[];
  center?: MapCenter | null;
  onSpotClick?: (spot: Spot) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
}

// Default center: Paris
const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 5;
// Roughly the app's 0.05° region once the photographer is located.
const LOCATE_ZOOM = 13;

export default function SpotMap({ spots, center, onSpotClick, onBoundsChange }: SpotMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // Latest click handler, so markers never need rebuilding when it changes.
  const onSpotClickRef = useRef(onSpotClick);
  // A centre asked for before Leaflet finished loading — applied on init.
  const pendingCenterRef = useRef<MapCenter | null>(null);

  useEffect(() => {
    onSpotClickRef.current = onSpotClick;
  }, [onSpotClick]);

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

      const map = L.map(containerRef.current, { attributionControl: false }).setView(
        DEFAULT_CENTER,
        DEFAULT_ZOOM,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // The screen's actions sit bottom-right, like the app's, so credit
      // OpenStreetMap on the other side rather than under a button.
      L.control.attribution({ position: "bottomleft" }).addTo(map);

      mapRef.current = map;

      // Add spots
      addMarkers(L, map, spots, (spot) => onSpotClickRef.current?.(spot));

      const pending = pendingCenterRef.current;
      if (pending) {
        pendingCenterRef.current = null;
        map.setView([pending.lat, pending.lng], pending.zoom ?? LOCATE_ZOOM);
      } else if (spots.length > 0) {
        // Fit bounds if we have spots
        const bounds = L.latLngBounds(
          spots.map((s) => [s.latitude, s.longitude] as [number, number]),
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }

      // Emit bounds on map move/zoom
      if (onBoundsChange) {
        const emitBounds = () => {
          const b = map.getBounds();
          onBoundsChange({
            swLat: b.getSouthWest().lat,
            swLng: b.getSouthWest().lng,
            neLat: b.getNorthEast().lat,
            neLng: b.getNorthEast().lng,
          });
        };

        map.on("moveend", emitBounds);
        // Emit initial bounds after the map is ready
        setTimeout(emitBounds, 100);
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

  // Move to a requested centre (the photographer's location)
  useEffect(() => {
    if (!center) return;
    const map = mapRef.current;
    if (!map) {
      pendingCenterRef.current = center;
      return;
    }
    map.flyTo([center.lat, center.lng], center.zoom ?? LOCATE_ZOOM, { duration: 0.8 });
  }, [center]);

  // Update markers when spots change
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      // Remove existing markers
      mapRef.current.eachLayer(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (layer: any) => {
          if (layer instanceof L.Marker) {
            mapRef.current.removeLayer(layer);
          }
        },
      );

      addMarkers(L, mapRef.current, spots, (spot) => onSpotClickRef.current?.(spot));
    });
  }, [spots]);

  // Below `lg` the map is touch-first like the app: no +/- buttons, pinch
  // to zoom. Desktop keeps Leaflet's zoom control.
  return (
    <div
      ref={containerRef}
      className="h-full w-full [&_.leaflet-control-zoom]:hidden lg:[&_.leaflet-control-zoom]:block"
    />
  );
}

function addMarkers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  spots: Spot[],
  onSpotClick: (spot: Spot) => void,
) {
  // The app's pin: a 14px spot in the brand blue, ringed by the page
  // background so it reads on any tile. Theme tokens, so it follows dark mode.
  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div style="
      box-sizing: border-box;
      width: 14px;
      height: 14px;
      border-radius: 9999px;
      background: var(--color-accent);
      border: 2px solid var(--color-bg);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  for (const spot of spots) {
    const marker = L.marker([spot.latitude, spot.longitude], {
      icon,
      title: spot.title ?? undefined,
    }).addTo(map);

    // Tapping a spot opens it, as in the app — no popup in between.
    marker.on("click", () => onSpotClick(spot));
  }
}

export type { MapBounds, MapCenter };
