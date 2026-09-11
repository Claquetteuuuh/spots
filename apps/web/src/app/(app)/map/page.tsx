"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import type { MapBounds, MapCenter } from "@/components/spot-map";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/use-t";

// react-leaflet must be loaded without SSR
const SpotMap = dynamic(() => import("@/components/spot-map"), { ssr: false });

type MapFilter = "mine" | "following";

export default function MapPage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filter, setFilter] = useState<MapFilter>("mine");
  const [isLoading, setIsLoading] = useState(true);
  const [center, setCenter] = useState<MapCenter | null>(null);

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

  // Centre on the photographer — once on open, like the app, and again on
  // demand. A denied or unavailable position is silent: the map stays put.
  const locateMe = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Always a fresh object, so re-locating from the same place still moves the map.
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {},
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    locateMe();
  }, [locateMe]);

  const openSpot = useCallback(
    (spot: Spot) => {
      router.push(`/spot/${spot.id}`);
    },
    [router],
  );

  const filters = [
    { key: "mine", label: t("map.mySpots") },
    { key: "following", label: t("map.followingSpots") },
  ] as const;

  return (
    // Below `lg` the screen is the viewport minus the tab bar, as in the app;
    // from `lg` it sits under the 3.5rem desktop header.
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-50px-env(safe-area-inset-bottom))] lg:h-[calc(100vh-3.5rem)]">
      {/* Segmented control — the screen's only chrome, centred like the app's */}
      <div className="relative z-10 flex shrink-0 justify-center bg-bg px-4 py-2">
        <div className="flex items-center rounded-md bg-bg-secondary p-[2px]">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`cursor-pointer rounded-sm px-5 py-2 text-[13px] font-medium leading-4 transition-colors ${
                filter === key
                  ? "bg-text text-bg"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop only: the app has no count */}
        <span className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-xs text-text-tertiary lg:block">
          {isLoading
            ? t("common.loading")
            : t("users.spots", { count: String(spots.length) })}
        </span>
      </div>

      {/* Map — isolate z-index so Leaflet internals don't overlap the bottom nav */}
      <div className="relative z-0 min-h-0 flex-1">
        <SpotMap
          spots={spots}
          center={center}
          onSpotClick={openSpot}
          onBoundsChange={handleBoundsChange}
        />

        {/* Locate me — 40px, hairline, above the FAB as in the app */}
        <button
          type="button"
          onClick={locateMe}
          aria-label={t("map.locateMe")}
          className="absolute bottom-[92px] right-5 z-[1000] flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border bg-bg text-text transition-colors hover:bg-bg-secondary"
        >
          <svg
            className="h-[18px] w-[18px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <path strokeLinecap="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
          </svg>
        </button>

        {/* Adding a spot is the whole point of the map, so the action lives on
            it. Below `lg` it is the app's 52px icon-only FAB; from `lg` the
            labelled pill desktop already has. */}
        <Link
          href="/spot/new"
          aria-label={t("spots.addSpot")}
          className="absolute bottom-7 right-5 z-[1000] inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent text-on-accent transition-colors hover:bg-accent-dark lg:bottom-10 lg:right-4 lg:h-auto lg:w-auto lg:gap-2 lg:py-3.5 lg:pl-4 lg:pr-5 lg:text-sm lg:font-semibold lg:shadow-float"
        >
          <svg
            className="h-[22px] w-[22px] lg:h-5 lg:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden lg:inline">{t("spots.addSpot")}</span>
        </Link>
      </div>
    </div>
  );
}
