"use client";

import { useSyncExternalStore } from "react";

/** Tailwind's `lg` breakpoint, where dropdowns replace bottom sheets. */
const DESKTOP_QUERY = "(min-width: 1024px)";

function canQuery(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function subscribe(onChange: () => void) {
  if (!canQuery()) return () => {};
  const list = window.matchMedia(DESKTOP_QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

const isDesktop = () => canQuery() && window.matchMedia(DESKTOP_QUERY).matches;

/** True from `lg` up; false on the server and wherever media queries are unavailable. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, isDesktop, () => false);
}
