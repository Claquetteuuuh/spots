"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

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
      <div className="flex items-center justify-center py-24">
        <p className="text-text-tertiary">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-error">{error ?? "Spot not found"}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === spot.userId;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Photo */}
      <div className="aspect-[16/10] w-full overflow-hidden rounded-sm border border-border bg-bg-secondary">
        <img
          src={spot.photoUrl}
          alt={spot.title ?? ""}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              {spot.title ? (
                <h1 className="text-2xl font-semibold text-text">
                  {spot.title}
                </h1>
              ) : null}
              {spot.city || spot.country ? (
                <p className="mt-1 text-sm text-text-secondary">
                  {[spot.city, spot.country].filter(Boolean).join(", ")}
                </p>
              ) : null}
            </div>

            {isOwner ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleDelete}>
                  {t("common.delete")}
                </Button>
              </div>
            ) : null}
          </div>

          {spot.description ? (
            <p className="text-text-secondary leading-relaxed">
              {spot.description}
            </p>
          ) : null}

          {/* Compositions */}
          {spot.compositions.length > 0 ? (
            <div>
              <h2 className="text-xs uppercase tracking-wide text-text-tertiary mb-2">
                {t("spots.composition")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {spot.compositions.map((c) => (
                  <span
                    key={c}
                    className="inline-block px-2.5 py-1 text-sm bg-sage/10 text-sage border border-sage/20 rounded-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Tags */}
          {spot.tags.length > 0 ? (
            <div>
              <h2 className="text-xs uppercase tracking-wide text-text-tertiary mb-2">
                {t("spots.tags")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {spot.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2.5 py-1 text-sm bg-bg-secondary text-text-secondary border border-border rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Colors */}
          {spot.colors.length > 0 ? (
            <div>
              <h2 className="text-xs uppercase tracking-wide text-text-tertiary mb-2">
                {t("spots.colors")}
              </h2>
              <div className="flex gap-2">
                {spot.colors.map((color) => (
                  <div
                    key={color}
                    className="h-8 w-8 rounded-sm border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Photographer */}
          {spot.user ? (
            <div className="border border-border rounded-sm p-4">
              <Link
                href={`/profile/${spot.user.username}`}
                className="flex items-center gap-3 group"
              >
                {spot.user.avatarUrl ? (
                  <img
                    src={spot.user.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-sm object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent text-white text-sm font-medium">
                    {spot.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                    {spot.user.name}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    @{spot.user.username}
                  </p>
                </div>
              </Link>
            </div>
          ) : null}

          {/* Access */}
          <div className="border border-border rounded-sm p-4">
            <h2 className="text-xs uppercase tracking-wide text-text-tertiary mb-2">
              {t("spots.pricing")}
            </h2>
            <p className="text-sm text-text">
              {spot.isFree ? t("common.free") : t("common.paid")}
            </p>
            {spot.priceInfo ? (
              <p className="mt-1 text-sm text-text-secondary">
                {spot.priceInfo}
              </p>
            ) : null}
          </div>

          {/* Location coordinates */}
          <div className="border border-border rounded-sm p-4">
            <h2 className="text-xs uppercase tracking-wide text-text-tertiary mb-2">
              GPS
            </h2>
            <p className="text-sm text-text-secondary font-mono">
              {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
