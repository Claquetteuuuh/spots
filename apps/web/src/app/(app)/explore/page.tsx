"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SpotCardSkeleton } from "@/components/ui/skeleton";

export default function ExplorePage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadSpots = useCallback(async (loadCursor?: string | null) => {
    setIsLoading(true);
    try {
      const result = await apiClient.spots.list({
        cursor: loadCursor ?? undefined,
        limit: 20,
      });
      setSpots((prev) =>
        loadCursor ? [...prev, ...result.items] : result.items,
      );
      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">
        {t("map.allSpots")}
      </h1>

      {/* Loading skeletons */}
      {isLoading && spots.length === 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SpotCardSkeleton />
          <SpotCardSkeleton />
          <SpotCardSkeleton />
          <SpotCardSkeleton />
          <SpotCardSkeleton />
          <SpotCardSkeleton />
        </div>
      ) : spots.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-text-secondary">{t("spots.noSpots")}</p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                href={`/spot/${spot.id}`}
                className="group border border-border rounded-sm overflow-hidden hover:border-accent/30 transition-colors"
              >
                <div className="aspect-[4/3] bg-bg-secondary overflow-hidden">
                  <img
                    src={spot.photoUrl}
                    alt={spot.title ?? ""}
                    className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="px-3 py-2.5">
                  {spot.title ? (
                    <p className="text-sm font-medium text-text truncate">
                      {spot.title}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between mt-0.5">
                    {spot.user ? (
                      <span className="text-xs text-text-tertiary truncate">
                        @{spot.user.username}
                      </span>
                    ) : null}
                    {spot.city ? (
                      <span className="text-xs text-text-tertiary truncate ml-2">
                        {spot.city}
                      </span>
                    ) : null}
                  </div>
                  {spot.compositions.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {spot.compositions.slice(0, 2).map((c) => (
                        <span
                          key={c}
                          className="inline-block px-1.5 py-0.5 text-[11px] bg-sage/10 text-sage border border-sage/20 rounded-sm"
                        >
                          {t(`compositions.${c}`)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          {hasMore ? (
            <div className="flex justify-center py-8">
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
  );
}
