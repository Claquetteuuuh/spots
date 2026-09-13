"use client";

import { useEffect, useRef, useState } from "react";
import { addBasemap } from "@/lib/map-tiles";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 5;
const PLACED_ZOOM = 13;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Leaflet = any;

/**
 * A map to put a spot on: tap to place, drag to adjust. Coordinates that
 * arrive from outside — an address search, the GPS, typed numbers — put
 * the pin down too and bring it into view.
 */
export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet>(null);
  const markerRef = useRef<Leaflet>(null);
  // Places or moves the pin; set once Leaflet is up.
  const placeRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const hasCoords = latitude !== null && longitude !== null;
      const map = L.map(containerRef.current).setView(
        hasCoords ? [latitude, longitude] : DEFAULT_CENTER,
        hasCoords ? PLACED_ZOOM : DEFAULT_ZOOM,
      );

      addBasemap(L, map);

      // The app's pin, in the brand blue — theme tokens, so it follows dark mode
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="box-sizing:border-box;width:18px;height:18px;border-radius:9999px;background:var(--color-accent);border:3px solid var(--color-bg);box-shadow:0 0 0 3px var(--color-accent-tint);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      placeRef.current = (lat, lng) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          return;
        }
        markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", (e: Leaflet) => {
          const pos = e.target.getLatLng();
          onChangeRef.current(pos.lat, pos.lng);
        });
      };
      if (hasCoords) placeRef.current(latitude, longitude);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        placeRef.current?.(lat, lng);
        onChangeRef.current(lat, lng);
      });

      mapRef.current = map;
      setIsReady(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        placeRef.current = null;
      }
    };
    // Initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coordinates from outside: put the pin down (or move it) and make sure
  // it is on screen, without yanking the map when it already is.
  useEffect(() => {
    const map = mapRef.current;
    if (!isReady || !map || latitude === null || longitude === null) return;
    placeRef.current?.(latitude, longitude);
    const latlng: [number, number] = [latitude, longitude];
    if (!map.getBounds().contains(latlng) || map.getZoom() < PLACED_ZOOM) {
      map.setView(latlng, Math.max(map.getZoom(), PLACED_ZOOM));
    }
  }, [latitude, longitude, isReady]);

  return <div ref={containerRef} className="h-full w-full" style={{ minHeight: "300px" }} />;
}
