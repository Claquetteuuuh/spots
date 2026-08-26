"use client";

import { useEffect, useRef, useState } from "react";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 5;

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

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

      const center: [number, number] =
        latitude !== null && longitude !== null
          ? [latitude, longitude]
          : DEFAULT_CENTER;

      const map = L.map(containerRef.current).setView(
        center,
        latitude !== null ? 13 : DEFAULT_ZOOM,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 16px;
          height: 16px;
          background: #8B7355;
          border: 3px solid #FAFAF8;
          border-radius: 2px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (latitude !== null && longitude !== null) {
        markerRef.current = L.marker([latitude, longitude], {
          icon,
          draggable: true,
        }).addTo(map);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        markerRef.current.on("dragend", (e: any) => {
          const pos = e.target.getLatLng();
          onChange(pos.lat, pos.lng);
        });
      }

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        onChange(lat, lng);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            icon,
            draggable: true,
          }).addTo(map);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          markerRef.current.on("dragend", (ev: any) => {
            const pos = ev.target.getLatLng();
            onChange(pos.lat, pos.lng);
          });
        }
      });

      mapRef.current = map;
      setIsReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker when coords change externally (e.g. geolocation)
  useEffect(() => {
    if (
      !isReady ||
      !mapRef.current ||
      latitude === null ||
      longitude === null
    )
      return;

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
    mapRef.current.setView([latitude, longitude], 13);
  }, [latitude, longitude, isReady]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "300px" }}
    />
  );
}
