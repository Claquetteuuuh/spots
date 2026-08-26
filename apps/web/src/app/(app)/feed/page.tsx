"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function FeedPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-text">
        {t("spots.feed")}
      </h1>

      {spots.length === 0 && !isLoading ? (
        <div className="mt-16 text-center">
          <p className="text-text-secondary">{t("spots.noSpots")}</p>
          <p className="mt-2 text-sm text-text-tertiary">
            Follow photographers to see their spots here
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {spots.map((spot) => (
            <article
              key={spot.id}
              className="border border-border rounded-sm overflow-hidden"
            >
              {/* Photo */}
              <Link href={`/spot/${spot.id}`}>
                <div className="aspect-[4/3] bg-bg-secondary overflow-hidden">
                  <img
                    src={spot.photoUrl}
                    alt={spot.title ?? ""}
                    className="h-full w-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  {spot.title ? (
                    <Link
                      href={`/spot/${spot.id}`}
                      className="font-medium text-text hover:text-accent transition-colors"
                    >
                      {spot.title}
                    </Link>
                  ) : null}
                  {spot.city ? (
                    <span className="text-xs text-text-tertiary">
                      {spot.city}
                      {spot.country ? `, ${spot.country}` : ""}
                    </span>
                  ) : null}
                </div>

                {spot.user ? (
                  <Link
                    href={`/profile/${spot.user.username}`}
                    className="mt-1 inline-block text-sm text-text-secondary hover:text-accent transition-colors"
                  >
                    @{spot.user.username}
                  </Link>
                ) : null}

                {/* Tags */}
                {spot.compositions.length > 0 || spot.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {spot.compositions.map((c) => (
                      <span
                        key={c}
                        className="inline-block px-2 py-0.5 text-xs bg-sage/10 text-sage border border-sage/20 rounded-sm"
                      >
                        {c}
                      </span>
                    ))}
                    {spot.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-0.5 text-xs bg-bg-secondary text-text-secondary border border-border rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          {/* Load more */}
          {hasMore ? (
            <div className="flex justify-center py-4">
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
