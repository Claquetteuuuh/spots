"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMapPins, onMapCacheInvalidated, readMapCache } from "@/lib/map-cache";
import type { MapCenter, MapViewport, SpotMapLabels } from "@/components/spot-map";
import { MapFiltersMenu } from "@/components/map-filters";
import {
  EMPTY_FILTERS,
  MAP_PINS_LIMIT,
  MAP_POLL_MS,
  boundsContain,
  countActiveFilters,
  filterPinsByColor,
  filtersToQuery,
  padBounds,
  quantizeBounds,
  type LatLng,
  type MapBounds,
  type MapFilters,
  type MapPin,
  type MapScope,
} from "@trs/shared/map";
import { useAuth } from "@/lib/auth-context";
import { useLivePosition } from "@/lib/use-live-position";
import { useT } from "@/lib/use-t";

// Leaflet must be loaded without SSR
const SpotMap = dynamic(() => import("@/components/spot-map"), { ssr: false });

/** Pans settle for this long before the viewport is fetched. */
const FETCH_DEBOUNCE_MS = 300;

/** The last box we fetched: a view inside it, with the same query, needs no request. */
interface FetchedArea {
  bounds: MapBounds;
  scope: MapScope;
  query: string;
  truncated: boolean;
}

export default function MapPage() {
  const { user } = useAuth();
  // The id, not the object: a refreshed session must not refetch the map.
  const userId = user?.id;
  const t = useT();
  const router = useRouter();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [scope, setScope] = useState<MapScope>("all");
  const [filters, setFilters] = useState<MapFilters>(EMPTY_FILTERS);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [center, setCenter] = useState<MapCenter | null>(null);
  // Live dot and heading; `position` above stays the snapshot filters work from.
  const { position: livePosition, requestHeadingPermission } = useLivePosition();

  const viewportRef = useRef<MapBounds | null>(null);
  const fetchedRef = useRef<FetchedArea | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Responses arriving out of order are dropped, not drawn.
  const requestSeqRef = useRef(0);

  // The server-side filters, keyed so a change reads as a new data set.
  // Colour families are matched here on the pins instead.
  const serverQuery = useMemo(() => filtersToQuery(filters, position), [filters, position]);
  const serverKey = JSON.stringify(serverQuery);
  const serverQueryRef = useRef(serverQuery);
  useEffect(() => {
    serverQueryRef.current = serverQuery;
  }, [serverQuery]);

  /**
   * Load pins for a view. Pads the box so small pans stay inside the last
   * fetched area and skip the request — unless that fetch hit the limit,
   * in which case zooming in may reveal pins we never received. The box
   * is snapped to a grid so nearby views share a cache entry and an ETag:
   * what we hold shows at once, the server confirms or replaces it.
   */
  const loadPins = useCallback(
    async (bounds: MapBounds, nextScope: MapScope, force = false) => {
      if (!userId) return;
      const query = serverQueryRef.current;
      const key = JSON.stringify(query);
      const last = fetchedRef.current;
      if (
        !force &&
        last &&
        last.scope === nextScope &&
        last.query === key &&
        !last.truncated &&
        boundsContain(last.bounds, bounds)
      ) {
        return;
      }

      const box = quantizeBounds(padBounds(bounds));
      const seq = ++requestSeqRef.current;
      const cached = readMapCache(box, nextScope, query);
      if (cached) {
        setPins(cached.items);
        fetchedRef.current = { bounds: box, scope: nextScope, query: key, truncated: cached.truncated };
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      const entry = await fetchMapPins(box, nextScope, query, MAP_PINS_LIMIT);
      if (seq !== requestSeqRef.current) return;
      if (entry) {
        fetchedRef.current = { bounds: box, scope: nextScope, query: key, truncated: entry.truncated };
        setPins(entry.items);
      }
      setIsLoading(false);
    },
    [userId],
  );

  // Debounced viewport handler
  const handleViewportChange = useCallback(
    ({ bounds }: MapViewport) => {
      viewportRef.current = bounds;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => loadPins(bounds, scope), FETCH_DEBOUNCE_MS);
    },
    [loadPins, scope],
  );

  // A new scope or filter set is a new data set: refetch the current view right away.
  useEffect(() => {
    const bounds = viewportRef.current;
    if (bounds) loadPins(bounds, scope, true);
  }, [scope, serverKey, loadPins]);

  // While the map is open and visible, re-ask for the current view every
  // MAP_POLL_MS (a 304 when nothing moved), on return to the tab, and the
  // moment a spot is created, edited or deleted anywhere in the app.
  useEffect(() => {
    const refresh = () => {
      const bounds = viewportRef.current;
      if (bounds && document.visibilityState === "visible") loadPins(bounds, scope, true);
    };
    const interval = setInterval(refresh, MAP_POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    const unsubscribe = onMapCacheInvalidated(refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      unsubscribe();
    };
  }, [scope, loadPins]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  // Centre on the photographer — once on open, like the app, and again on
  // demand. A denied or unavailable position is silent: the map stays put.
  const locateMe = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude });
        // Always a fresh object, so re-locating from the same place still moves the map.
        setCenter({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {},
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    locateMe();
  }, [locateMe]);

  // The button is a tap, which is what iOS wants before it shares the compass.
  const locateMeFromTap = useCallback(() => {
    void requestHeadingPermission();
    locateMe();
  }, [requestHeadingPermission, locateMe]);

  const openSpot = useCallback(
    (pin: MapPin) => {
      router.push(`/spot/${pin.id}`);
    },
    [router],
  );

  const labels = useMemo<SpotMapLabels>(
    () => ({
      cluster: (count) => t("map.spotsInCluster", { count: String(count) }),
      untitled: t("spots.untitled"),
      open: t("map.openSpot"),
      youAreHere: t("map.youAreHere"),
    }),
    [t],
  );

  const visiblePins = useMemo(() => filterPinsByColor(pins, filters.colors), [pins, filters.colors]);
  const nothingMatches = !isLoading && countActiveFilters(filters) > 0 && visiblePins.length === 0;

  const scopes = [
    { key: "all", label: t("map.allSpots") },
    { key: "mine", label: t("map.mySpots") },
    { key: "following", label: t("map.followingSpots") },
  ] as const;

  return (
    // Below `lg` the screen is the viewport minus the tab bar, as in the app;
    // from `lg` it sits under the 3.5rem desktop header.
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-50px-env(safe-area-inset-bottom))] lg:h-[calc(100vh-3.5rem)]">
      {/* Segmented control + filters — the screen's only chrome, centred like the app's */}
      <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-bg px-4 py-2">
        <div className="flex items-center rounded-md bg-bg-secondary p-[2px]">
          {scopes.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={scope === key}
              onClick={() => setScope(key)}
              className={`cursor-pointer rounded-sm px-4 py-2 text-[13px] font-medium leading-4 transition-colors ${
                scope === key
                  ? "bg-text text-bg"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <MapFiltersMenu
          filters={filters}
          onChange={setFilters}
          hasPosition={position !== null}
          onRequestPosition={locateMe}
        />

        {/* Desktop only: the app has no count */}
        <span className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-xs text-text-tertiary lg:block">
          {isLoading
            ? t("common.loading")
            : t("users.spots", { count: String(visiblePins.length) })}
        </span>
      </div>

      {/* Map — isolate z-index so Leaflet internals don't overlap the bottom nav */}
      <div className="relative z-0 min-h-0 flex-1">
        <SpotMap
          pins={visiblePins}
          center={center}
          userPosition={livePosition}
          labels={labels}
          onSpotClick={openSpot}
          onViewportChange={handleViewportChange}
        />

        {nothingMatches ? (
          <p className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-bg px-3 py-1.5 text-xs text-text-secondary shadow-float">
            {t("map.noSpotsMatch")}
          </p>
        ) : null}

        {/* Locate me — 40px, hairline, above the FAB as in the app */}
        <button
          type="button"
          onClick={locateMeFromTap}
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
