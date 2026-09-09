"use client";

import type { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

/**
 * Wrap a page section with pull-to-refresh behavior.
 * Shows a spinner indicator when the user pulls down from the top.
 */
export function PullToRefresh({
  onRefresh,
  children,
  className = "",
}: PullToRefreshProps) {
  const { isRefreshing, pullProgress, pullDistance, containerRef } =
    usePullToRefresh({ onRefresh });

  const showIndicator = pullProgress > 0 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ overscrollBehavior: "contain" }}
    >
      {/* Pull indicator */}
      {showIndicator ? (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-200"
          style={{ height: isRefreshing ? 40 : pullDistance }}
        >
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-full bg-bg-secondary border border-border
              ${isRefreshing ? "animate-spin" : ""}`}
            style={
              !isRefreshing
                ? { transform: `rotate(${pullProgress * 360}deg)` }
                : undefined
            }
          >
            <svg
              className="h-4 w-4 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
          </div>
        </div>
      ) : null}

      {children}
    </div>
  );
}
