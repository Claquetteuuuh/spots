"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import type { MapBounds } from "@/components/spot-map";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/use-t";
import Link from "next/link";

// react-leaflet must be loaded without SSR
const SpotMap = dynamic(() => import("@/components/spot-map"), { ssr: false });

type MapFilter = "mine" | "following";

export default function MapPage() {
  const { user } = useAuth();
  const t = useT();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filter, setFilter] = useState<MapFilter>("mine");
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
        } else if (user) {
          result = await apiClient.spots.list({
            userId: user.id,
            ...(bounds ?? {}),
            limit: 50,
          });
        } else {
          result = { items: [] };
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
    <div className="flex flex-1 flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] -mb-16 md:mb-0 overflow-hidden">
      {/* Filter bar — pill-shaped segmented control */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg relative z-10">
        <div className="flex items-center gap-1 rounded-full bg-bg-secondary p-1">
          {(
            [
              { key: "mine", label: t("map.mySpots") },
              { key: "following", label: t("map.followingSpots") },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
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

      {/* Map — isolate z-index so Leaflet internals don't overlap the bottom nav */}
      <div className="flex-1 relative z-0">
        <SpotMap spots={spots} onBoundsChange={handleBoundsChange} />

        {/* Adding a spot is the whole point of the map, so the action lives on
            it. Clear of the mobile tab bar, and of Leaflet's own controls. */}
        <Link
          href="/spot/new"
          className="absolute bottom-20 right-4 z-[500] inline-flex items-center gap-2 rounded-full bg-accent py-3.5 pl-4 pr-5 text-sm font-semibold text-on-accent shadow-float transition-colors hover:bg-accent-dark md:bottom-10"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("spots.addSpot")}
        </Link>
      </div>
    </div>
  );
}
