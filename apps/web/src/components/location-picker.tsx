"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as GLMap, Marker } from "maplibre-gl";
import { addMarker, createMap, markerElement, toGLZoom } from "@/lib/map-engine";
import { loadStyle, watchMapTheme } from "@/lib/map-tiles";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

/** Paris, until the photographer says otherwise. */
const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566];
const DEFAULT_ZOOM = 5;
const PLACED_ZOOM = 13;

/** The app's pin, in the brand blue — theme tokens, so it follows dark mode. */
const PIN_HTML = `<div style="box-sizing:border-box;width:20px;height:20px;border-radius:9999px;background:var(--color-accent);border:3px solid var(--color-bg);box-shadow:0 0 0 3px var(--color-accent-tint);cursor:grab;"></div>`;

/**
 * A map to put a spot on: tap to place, drag to adjust. Coordinates that
 * arrive from outside — an address search, the GPS, typed numbers — put
 * the pin down too and bring it into view.
 */
export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GLMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  /** Places or moves the pin; set once the map is up. */
  const placeRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let stopThemeWatch = () => {};
    const hasCoords = latitude !== null && longitude !== null;

    void createMap({
      container: containerRef.current!,
      center: hasCoords ? [longitude, latitude] : DEFAULT_CENTER,
      zoom: hasCoords ? PLACED_ZOOM : DEFAULT_ZOOM,
    }).then(async (map) => {
      if (cancelled) {
        map.remove();
        return;
      }
      mapRef.current = map;

      const place = async (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
          return;
        }
        const marker = await addMarker(map, [lng, lat], markerElement(PIN_HTML, "location-pin"), { draggable: true });
        marker.on("dragend", () => {
          const { lat: dragLat, lng: dragLng } = marker.getLngLat();
          onChangeRef.current(dragLat, dragLng);
        });
        markerRef.current = marker;
      };
      placeRef.current = (lat, lng) => void place(lat, lng);
      if (hasCoords) placeRef.current(latitude, longitude);

      map.on("click", (e) => {
        placeRef.current?.(e.lngLat.lat, e.lngLat.lng);
        onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
      });

      stopThemeWatch = watchMapTheme((dark) => {
        void loadStyle(dark).then((style) => map.setStyle(style as never));
      });
      setIsReady(true);
    });

    return () => {
      cancelled = true;
      stopThemeWatch();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      placeRef.current = null;
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
    const inView = map.getBounds().contains([longitude, latitude]);
    if (!inView || map.getZoom() < toGLZoom(PLACED_ZOOM)) {
      map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), toGLZoom(PLACED_ZOOM)) });
    }
  }, [latitude, longitude, isReady]);

  return <div ref={containerRef} className="h-full w-full" style={{ minHeight: "300px" }} />;
}
