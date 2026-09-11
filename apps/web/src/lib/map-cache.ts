import {
  MapCache,
  mapCacheKey,
  type MapBounds,
  type MapCacheEntry,
  type MapFilterQuery,
  type MapScope,
} from "@trs/shared/map";
import { apiClient, onSpotsChanged } from "@/lib/api-client";

/**
 * The map's viewport cache: what was last shown for a box is shown again
 * at once, then confirmed (a 304) or replaced by the server. Kept across
 * client-side navigation in memory and across reloads in localStorage;
 * dropped whole the moment a spot changes from this app.
 */

const STORAGE_KEY = "spots:map-cache:v1";

let cache: MapCache | null = null;
const inFlight = new Map<string, Promise<MapCacheEntry | null>>();
const listeners = new Set<() => void>();
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function store(): MapCache {
  if (!cache) {
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      raw = saved ? JSON.parse(saved) : null;
    } catch {
      raw = null;
    }
    cache = MapCache.fromJSON(raw);
  }
  return cache;
}

/** Write-behind: many pans, one serialisation. */
function persist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store()));
    } catch {
      // Quota or private mode — the in-memory copy still works
    }
  }, 500);
}

export function readMapCache(
  bounds: MapBounds,
  scope: MapScope,
  query: MapFilterQuery,
): MapCacheEntry | undefined {
  return store().get(mapCacheKey(bounds, scope, query));
}

/**
 * Fetch a box, conditionally when we hold it, and cache the answer.
 * Resolves to the entry now in the cache, or null when the request
 * failed. Concurrent calls for the same box share one request.
 */
export function fetchMapPins(
  bounds: MapBounds,
  scope: MapScope,
  query: MapFilterQuery,
  limit: number,
): Promise<MapCacheEntry | null> {
  const key = mapCacheKey(bounds, scope, query);
  const pending = inFlight.get(key);
  if (pending) return pending;

  const cached = store().get(key);
  const run = (async () => {
    try {
      const res = await apiClient.spots.map(
        { ...bounds, ...query, scope, limit },
        { etag: cached?.etag ?? null },
      );
      if (res.notModified) {
        store().touch(key);
        return store().get(key) ?? null;
      }
      const entry: MapCacheEntry = {
        items: res.items,
        truncated: res.truncated,
        etag: res.etag ?? null,
        fetchedAt: Date.now(),
      };
      store().set(key, entry);
      persist();
      return entry;
    } catch (err) {
      console.error("Failed to load map spots:", err);
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, run);
  return run;
}

/** Forget every box and tell open maps to ask again. */
export function invalidateMapCache(): void {
  store().clear();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  for (const listener of listeners) listener();
}

export function onMapCacheInvalidated(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// A spot created, edited or deleted anywhere in the app empties the cache.
onSpotsChanged(invalidateMapCache);
