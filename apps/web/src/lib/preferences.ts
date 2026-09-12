"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Device-side preferences: things that belong to this browser rather
 * than the account, like whether the map may use the sensors here.
 */

const LIVE_POSITION_KEY = "spots:live-position";
const CHANGE_EVENT = "spots:preferences-change";

// Where localStorage is missing or refused (private mode, quota), the
// choice still holds for this page load.
const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string): void {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // The in-memory copy carries it for this page load
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Whether the map shows the photographer's live position. On unless turned off. */
export function isLivePositionEnabled(): boolean {
  return read(LIVE_POSITION_KEY) !== "off";
}

export function setLivePositionEnabled(enabled: boolean): void {
  write(LIVE_POSITION_KEY, enabled ? "on" : "off");
}

export function useLivePositionPref(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, isLivePositionEnabled, () => true);
  const set = useCallback((next: boolean) => setLivePositionEnabled(next), []);
  return [enabled, set];
}
