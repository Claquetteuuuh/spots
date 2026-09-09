"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { SpotCardSkeleton } from "@/components/ui/skeleton";
import { PAGE_WIDE } from "@/components/page";

export default function ExplorePage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useT();
  const [hasMore, setHasMore] = useState(true);

  const loadSpots = useCallback(async (loadCursor?: string | null) => {
    setIsLoading(true);
    try {
      const result = await apiClient.spots.list({
        cursor: loadCursor ?? undefined,
        limit: 21,
      });
      setSpots((prev) =>
        loadCursor ? [...prev, ...result.items] : result.items,
      );
      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (err) {
      console.error("Failed to load spots:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      loadSpots();
    });
  }, [loadSpots]);

  const handleRefresh = useCallback(async () => {
    await loadSpots();
  }, [loadSpots]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className={`${PAGE_WIDE} px-0 py-0 sm:px-4 sm:py-6`}>
      {/* Loading skeletons */}
      {isLoading && spots.length === 0 ? (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-bg-secondary animate-pulse" />
          ))}
        </div>
      ) : spots.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-text-secondary">{t("spots.noSpots")}</p>
        </div>
      ) : (
        <>
          {/* Instagram-style 3-column grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                href={`/spot/${spot.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-bg-secondary"
              >
                <img
                  src={spot.photoUrl}
                  alt={spot.title ?? ""}
                  className="h-full w-full object-cover group-hover:opacity-75 transition-opacity duration-200"
                />
                {/* Hover overlay with location */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {spot.city ? (
                    <span className="text-white text-sm font-semibold drop-shadow-md">
                      {spot.city}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          {hasMore ? (
            <div className="flex justify-center py-8 px-4">
              <Button
                variant="secondary"
                onClick={() => loadSpots(cursor)}
                loading={isLoading}
              >
                {t("common.next")}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
    </PullToRefresh>
  );
}
