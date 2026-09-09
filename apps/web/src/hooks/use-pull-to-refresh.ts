"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  /** Callback to execute on refresh. Should return a promise. */
  onRefresh: () => Promise<void>;
  /** Minimum pull distance to trigger refresh (px). Default: 80. */
  threshold?: number;
  /** Whether the hook is enabled. Default: true. */
  enabled?: boolean;
}

/**
 * Pull-to-refresh hook for mobile-style gesture refresh.
 * Attaches to a scrollable container (or window if no ref is given).
 *
 * Returns:
 * - `isRefreshing`: whether the refresh callback is running
 * - `pullProgress`: 0–1 value of how far the user has pulled
 * - `containerRef`: ref to attach to the scrollable container
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    const el = containerRef.current ?? document.documentElement;

    function isAtTop(): boolean {
      if (containerRef.current) {
        return containerRef.current.scrollTop <= 0;
      }
      return window.scrollY <= 0;
    }

    function onTouchStart(e: TouchEvent) {
      if (!isAtTop()) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff < 0) {
        pulling.current = false;
        setPullDistance(0);
        pullDistanceRef.current = 0;
        return;
      }
      // Dampen the pull distance
      const distance = Math.min(diff * 0.4, threshold * 1.5);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    }

    function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistanceRef.current >= threshold) {
        handleRefresh();
      } else {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, threshold, handleRefresh]);

  return {
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1),
    pullDistance,
    containerRef,
  };
}
