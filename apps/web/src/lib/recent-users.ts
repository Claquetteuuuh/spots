"use client";

import { useCallback, useSyncExternalStore } from "react";

/** What a recent search result needs to be shown again. */
export interface RecentUser {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

const STORAGE_KEY = "spots:recent-users";
const CHANGE_EVENT = "spots:recent-users-change";
export const RECENT_USERS_MAX = 8;

let memory: RecentUser[] | null = null;

function read(): RecentUser[] {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    memory = Array.isArray(parsed)
      ? parsed.filter(
          (u): u is RecentUser =>
            typeof u === "object" && u !== null && typeof (u as RecentUser).id === "string",
        )
      : [];
  } catch {
    memory = [];
  }
  return memory;
}

function write(list: RecentUser[]): void {
  memory = list;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Private mode or full — kept in memory for this page load
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

const EMPTY: RecentUser[] = [];

/** Move (or add) a user to the front of the list, keeping it short. */
export function rememberUser(user: RecentUser): void {
  const rest = read().filter((u) => u.id !== user.id);
  write([{ id: user.id, username: user.username, name: user.name, avatarUrl: user.avatarUrl }, ...rest].slice(0, RECENT_USERS_MAX));
}

export function forgetUser(id: string): void {
  write(read().filter((u) => u.id !== id));
}

export function clearRecentUsers(): void {
  write([]);
}

/** People looked up recently on this device, most recent first. */
export function useRecentUsers(): {
  recent: RecentUser[];
  remember: (user: RecentUser) => void;
  forget: (id: string) => void;
  clear: () => void;
} {
  const recent = useSyncExternalStore(subscribe, read, () => EMPTY);
  const remember = useCallback((user: RecentUser) => rememberUser(user), []);
  const forget = useCallback((id: string) => forgetUser(id), []);
  const clear = useCallback(() => clearRecentUsers(), []);
  return { recent, remember, forget, clear };
}
