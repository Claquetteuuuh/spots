"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ActivityKind } from "@trs/shared/validation";
import { apiClient } from "@/lib/api-client";
import type { ActivityLike, ActivityPhoto } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { PAGE_COLUMN, PageHeader } from "@/components/page";

const KINDS: ActivityKind[] = ["likes", "photos"];

/**
 * What the viewer has done around spots — the spots they liked and the
 * photos they added — one list at a time, newest first.
 */
export default function ActivityPage() {
  const t = useT();
  const [kind, setKind] = useState<ActivityKind>("likes");
  const [items, setItems] = useState<(ActivityLike | ActivityPhoto)[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (which: ActivityKind, after?: string) => {
    setIsLoading(true);
    try {
      const page = await apiClient.me.activity(which, after);
      setItems((prev) => (after ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
    } catch {
      // The empty state says enough
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load(kind);
    });
  }, [kind, load]);

  const spotLabel = (spot: ActivityLike["spot"]) => spot.title || t("spots.untitled");
  const placeLabel = (spot: ActivityLike["spot"]) => [spot.city, spot.country].filter(Boolean).join(", ");

  return (
    <div className={PAGE_COLUMN}>
      <PageHeader title={t("settings.activity")} />

      {/* Two pills, one list */}
      <div className="flex gap-2 pt-4" role="tablist">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`h-9 cursor-pointer rounded-full border px-4 text-[13px] font-medium transition-colors ${
              kind === k
                ? "border-accent bg-accent-tint text-accent"
                : "border-border bg-bg text-text-secondary hover:text-text"
            }`}
            data-testid={`activity-tab-${k}`}
          >
            {k === "likes" ? t("settings.activityLikes") : t("settings.activityPhotos")}
          </button>
        ))}
      </div>

      {items.length === 0 && !isLoading ? (
        <p className="py-16 text-center text-[15px] text-text-secondary">
          {kind === "likes" ? t("settings.activityEmptyLikes") : t("settings.activityEmptyPhotos")}
        </p>
      ) : (
        <ul className="pt-2">
          {items.map((item) => {
            const photo = "photoUrl" in item ? item : null;
            return (
              <li key={item.id} className="-mx-4 border-b border-border lg:mx-0" data-testid={`activity-${item.id}`}>
                <Link href={`/spot/${item.spot.id}`} className="flex items-center gap-3 px-4 py-3 lg:px-0">
                  <img
                    src={photo ? photo.photoUrl : item.spot.photoUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    {photo ? (
                      <>
                        <p className="truncate text-[15px] text-text">{photo.caption || spotLabel(item.spot)}</p>
                        <p className="truncate text-xs text-text-secondary">
                          {t("settings.activityOn")} {spotLabel(item.spot)} · @{item.spot.user.username}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="truncate text-[15px] font-semibold text-text">{spotLabel(item.spot)}</p>
                        <p className="truncate text-xs text-text-secondary">
                          {[placeLabel(item.spot), `@${item.spot.user.username}`].filter(Boolean).join(" · ")}
                        </p>
                      </>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {cursor ? (
        <button
          type="button"
          onClick={() => void load(kind, cursor)}
          disabled={isLoading}
          className="mx-auto my-6 block cursor-pointer rounded-full border border-border px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:text-text disabled:opacity-40"
          data-testid="activity-more"
        >
          {t("common.next")}
        </button>
      ) : null}
    </div>
  );
}
