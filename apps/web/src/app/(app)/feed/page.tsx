"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Spot, SpotImage } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { SpotCardSkeleton } from "@/components/ui/skeleton";

// ─── Feed Image Carousel ────────────────────────────────────────────

function FeedCarousel({
  images,
  fallbackUrl,
  alt,
}: {
  images?: SpotImage[];
  fallbackUrl: string;
  alt: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMultiple = images && images.length > 1;

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square sm:aspect-[4/3] bg-bg-secondary overflow-hidden">
        <img src={fallbackUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (!hasMultiple) {
    return (
      <div className="aspect-square sm:aspect-[4/3] bg-bg-secondary overflow-hidden">
        <img src={images[0].photoUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="relative aspect-square sm:aspect-[4/3] bg-bg-secondary overflow-hidden group">
      <img
        src={images[currentIndex].photoUrl}
        alt={alt}
        className="h-full w-full object-cover transition-opacity duration-200"
      />

      {/* Left arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-bg/60 backdrop-blur-sm text-text hover:bg-bg/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-border/40"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-bg/60 backdrop-blur-sm text-text hover:bg-bg/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-border/40"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Counter badge */}
      <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-bg/60 backdrop-blur-sm text-text rounded-lg border border-border/40">
        {currentIndex + 1}/{images.length}
      </span>

      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(i);
            }}
            className={`rounded-full transition-all cursor-pointer ${
              i === currentIndex
                ? "h-1.5 w-1.5 bg-white"
                : "h-1 w-1 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Feed Spot Card ─────────────────────────────────────────────────

function FeedSpotCard({ spot }: { spot: Spot }) {
  const t = useT();

  return (
    <article className="bg-bg sm:border sm:border-border sm:rounded-2xl overflow-hidden">
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-on-accent text-xs font-semibold">
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

      {/* Photo carousel — full width */}
      <Link href={`/spot/${spot.id}`}>
        <FeedCarousel
          images={spot.images}
          fallbackUrl={spot.photoUrl}
          alt={spot.title ?? ""}
        />
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
                className="inline-block rounded-full bg-accent-tint px-2.5 py-0.5 text-xs font-medium text-accent-dark"
              >
                {t(`compositions.${c}`)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ─── Feed Page ──────────────────────────────────────────────────────

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

  const handleRefresh = useCallback(async () => {
    await loadSpots();
  }, [loadSpots]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
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
            <FeedSpotCard key={spot.id} spot={spot} />
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
    </PullToRefresh>
  );
}
