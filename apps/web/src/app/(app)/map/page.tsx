"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import type { MapBounds } from "@/components/spot-map";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/use-t";

// react-leaflet must be loaded without SSR
const SpotMap = dynamic(() => import("@/components/spot-map"), { ssr: false });

type MapFilter = "mine" | "following" | "all";

export default function MapPage() {
  const { user } = useAuth();
  const t = useT();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Store the latest bounds so we can re-fetch when filter changes
  const boundsRef = useRef<MapBounds | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSpots = useCallback(
    async (bounds?: MapBounds | null) => {
      setIsLoading(true);
      try {
        let result;
        if (filter === "following") {
          result = await apiClient.spots.feed({
            ...(bounds ?? {}),
            limit: 50,
          });
        } else if (filter === "mine" && user) {
          result = await apiClient.spots.list({
            userId: user.id,
            ...(bounds ?? {}),
            limit: 50,
          });
        } else {
          result = await apiClient.spots.list({
            ...(bounds ?? {}),
            limit: 50,
          });
        }
        setSpots(result.items);
      } catch (err) {
        console.error("Failed to load map spots:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [filter, user],
  );

  // Initial load
  useEffect(() => {
    loadSpots(boundsRef.current);
  }, [loadSpots]);

  // Debounced bounds change handler
  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      boundsRef.current = bounds;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        loadSpots(bounds);
      }, 500);
    },
    [loadSpots],
  );

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      {/* Filter bar — pill-shaped segmented control */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg">
        <div className="flex items-center gap-1 rounded-md bg-bg-secondary p-0.5">
          {(
            [
              { key: "all", label: t("map.allSpots") },
              { key: "mine", label: t("map.mySpots") },
              { key: "following", label: t("map.followingSpots") },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filter === key
                  ? "bg-bg text-text shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs text-text-tertiary">
          {isLoading
            ? t("common.loading")
            : t("users.spots", { count: String(spots.length) })}
        </span>
      </div>

      {/* Map */}
      <div className="flex-1">
        <SpotMap spots={spots} onBoundsChange={handleBoundsChange} />
      </div>
    </div>
  );
}
