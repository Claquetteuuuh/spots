"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api-client";
import type { Spot } from "@/lib/api-client";
import { t } from "@/lib/i18n";

// react-leaflet must be loaded without SSR
const SpotMap = dynamic(() => import("@/components/spot-map"), { ssr: false });

type MapFilter = "mine" | "following" | "all";

export default function MapPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadSpots = useCallback(async () => {
    setIsLoading(true);
    try {
      let result;
      if (filter === "following") {
        result = await apiClient.spots.feed();
      } else {
        result = await apiClient.spots.list(
          filter === "mine" ? {} : undefined,
        );
      }
      setSpots(result.items);
    } catch {
      // Silently fail — empty map
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-3.5rem)]">
      {/* Filter bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        {(
          [
            { key: "all", label: t("map.allSpots") },
            { key: "mine", label: t("map.mySpots") },
            { key: "following", label: t("map.followingSpots") },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-1 text-sm rounded-sm transition-colors cursor-pointer ${
              filter === key
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-bg-secondary"
            }`}
          >
            {label}
          </button>
        ))}

        {isLoading ? (
          <span className="ml-auto text-xs text-text-tertiary">
            {t("common.loading")}
          </span>
        ) : (
          <span className="ml-auto text-xs text-text-tertiary">
            {t("users.spots", { count: String(spots.length) })}
          </span>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <SpotMap spots={spots} />
      </div>
    </div>
  );
}
