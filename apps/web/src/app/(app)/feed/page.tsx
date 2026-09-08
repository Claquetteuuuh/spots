"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { Button } from "@/components/ui/button";
import { SpotCardSkeleton } from "@/components/ui/skeleton";

export default function FeedPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useT();
  const [hasMore, setHasMore] = useState(true);

  const loadSpots = useCallback(async (loadCursor?: string | null) => {
    setIsLoading(true);
    try {
      const result = await apiClient.spots.feed({
        cursor: loadCursor ?? undefined,
        limit: 20,
      });
      setSpots((prev) =>
        loadCursor ? [...prev, ...result.items] : result.items,
      );
      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      loadSpots();
    });
  }, [loadSpots]);

  return (
    <div className="mx-auto max-w-lg px-0 sm:px-4 py-0 sm:py-4">
      {/* Loading skeletons */}
      {isLoading && spots.length === 0 ? (
        <div className="space-y-0 sm:space-y-4">
          <SpotCardSkeleton />
          <SpotCardSkeleton />
          <SpotCardSkeleton />
        </div>
      ) : spots.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-text-secondary">{t("spots.noSpots")}</p>
          <p className="mt-2 text-sm text-text-tertiary">
            {t("spots.followHint")}
          </p>
          <Link href="/search">
            <Button variant="primary" className="mt-6">
              {t("common.search")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border sm:space-y-4 sm:divide-y-0">
          {spots.map((spot) => (
            <article
              key={spot.id}
              className="bg-bg sm:border sm:border-border sm:rounded-md overflow-hidden"
            >
              {/* User header — Instagram style */}
              {spot.user ? (
                <Link
                  href={`/profile/${spot.user.username}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {spot.user.avatarUrl ? (
                    <img
                      src={spot.user.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-xs font-semibold">
                      {spot.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">
                      {spot.user.username}
                    </p>
                    {spot.city ? (
                      <p className="text-xs text-text-tertiary truncate">
                        {spot.city}{spot.country ? `, ${spot.country}` : ""}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ) : null}

              {/* Photo — full width */}
              <Link href={`/spot/${spot.id}`}>
                <div className="aspect-square sm:aspect-[4/3] bg-bg-secondary overflow-hidden">
                  <img
                    src={spot.photoUrl}
                    alt={spot.title ?? ""}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>

              {/* Info below photo */}
              <div className="px-4 py-3">
                {spot.title ? (
                  <p className="text-sm">
                    {spot.user ? (
                      <Link
                        href={`/profile/${spot.user.username}`}
                        className="font-semibold text-text hover:text-text-secondary transition-colors"
                      >
                        {spot.user.username}
                      </Link>
                    ) : null}
                    {spot.user ? " " : null}
                    <span className="text-text">{spot.title}</span>
                  </p>
                ) : null}

                {/* Tags */}
                {spot.compositions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {spot.compositions.map((c) => (
                      <span
                        key={c}
                        className="inline-block px-2 py-0.5 text-xs bg-sage/10 text-sage border border-sage/20 rounded-sm"
                      >
                        {t(`compositions.${c}`)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          {/* Load more */}
          {hasMore ? (
            <div className="flex justify-center py-6 px-4">
              <Button
                variant="secondary"
                onClick={() => loadSpots(cursor)}
                loading={isLoading}
              >
                {t("common.next")}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
