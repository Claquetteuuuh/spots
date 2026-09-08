"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/use-t";

const MiniMap = dynamic(() => import("@/components/mini-map"), { ssr: false });

export default function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();

  const [spot, setSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSpot = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.spots.get(id);
      setSpot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSpot();
  }, [loadSpot]);

  async function handleDelete() {
    if (!spot) return;
    if (!window.confirm(t("spots.deleteConfirm"))) return;

    try {
      await apiClient.spots.delete(spot.id);
      router.push("/map");
    } catch {
      // Show error
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="aspect-[16/10] w-full" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-error">{error ?? t("users.notFound")}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === spot.userId;

  return (
    <div className="mx-auto max-w-5xl px-0 sm:px-4 py-0 sm:py-6">
      {/* Instagram-style post layout */}
      <div className="sm:border sm:border-border sm:rounded-md overflow-hidden bg-bg">
        {/* User header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {spot.user ? (
            <Link
              href={`/profile/${spot.user.username}`}
              className="flex items-center gap-3 group"
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
              <div>
                <p className="text-sm font-semibold text-text group-hover:text-text-secondary transition-colors">
                  {spot.user.username}
                </p>
                {spot.city || spot.country ? (
                  <p className="text-xs text-text-tertiary">
                    {[spot.city, spot.country].filter(Boolean).join(", ")}
                  </p>
                ) : null}
              </div>
            </Link>
          ) : null}

          {isOwner ? (
            <button
              onClick={handleDelete}
              className="p-2 text-text-tertiary hover:text-error transition-colors cursor-pointer"
              title={t("common.delete")}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Photo — full width */}
        <div className="aspect-square sm:aspect-[4/3] bg-bg-secondary overflow-hidden">
          <img
            src={spot.photoUrl}
            alt={spot.title ?? ""}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Details below photo */}
        <div className="px-4 py-4 space-y-4">
          {/* Title + description */}
          {spot.title ? (
            <p className="text-sm">
              {spot.user ? (
                <span className="font-semibold text-text">{spot.user.username}</span>
              ) : null}
              {spot.user ? " " : null}
              <span className="text-text">{spot.title}</span>
            </p>
          ) : null}

          {spot.description ? (
            <p className="text-sm text-text-secondary leading-relaxed">
              {spot.description}
            </p>
          ) : null}

          {/* Compositions */}
          {spot.compositions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {spot.compositions.map((c) => (
                <span
                  key={c}
                  className="inline-block px-2.5 py-1 text-xs bg-sage/10 text-sage border border-sage/20 rounded-sm"
                >
                  {t(`compositions.${c}`)}
                </span>
              ))}
            </div>
          ) : null}

          {/* Tags */}
          {spot.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {spot.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2.5 py-1 text-xs bg-bg-secondary text-text-secondary border border-border rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* Colors */}
          {spot.colors.length > 0 ? (
            <div className="flex gap-2">
              {spot.colors.map((color) => (
                <div
                  key={color}
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          ) : null}

          {/* Access */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-0.5 rounded-sm text-xs font-medium ${
              spot.isFree
                ? "bg-sage/10 text-sage border border-sage/20"
                : "bg-accent/10 text-accent border border-accent/20"
            }`}>
              {spot.isFree ? t("common.free") : t("common.paid")}
            </span>
            {spot.priceInfo ? (
              <span className="text-text-secondary">{spot.priceInfo}</span>
            ) : null}
          </div>
        </div>

        {/* Mini map */}
        <div className="border-t border-border">
          <div className="h-40 sm:h-48">
            <MiniMap latitude={spot.latitude} longitude={spot.longitude} />
          </div>
          <div className="px-4 py-2 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-tertiary font-mono">
              {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
            </p>
            {spot.address ? (
              <p className="text-xs text-text-tertiary truncate ml-4">
                {spot.address}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
