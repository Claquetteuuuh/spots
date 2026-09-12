import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

/** What a recent search result needs to be shown again. */
export interface RecentUser {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
}

const KEY = "spots.recentUsers";
export const RECENT_USERS_MAX = 8;

interface RecentUsersState {
  recent: RecentUser[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Move (or add) a user to the front of the list, keeping it short. */
  remember: (user: RecentUser) => Promise<void>;
  forget: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

async function persist(list: RecentUser[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(list));
  } catch {
    // Kept in memory for this run
  }
}

export const useRecentUsersStore = create<RecentUsersState>()((set, get) => ({
  recent: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      set({
        recent: Array.isArray(parsed)
          ? parsed.filter(
              (u): u is RecentUser =>
                typeof u === "object" && u !== null && typeof (u as RecentUser).id === "string",
            )
          : [],
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  remember: async (user) => {
    const next = [
      { id: user.id, username: user.username, name: user.name, avatarUrl: user.avatarUrl ?? null },
      ...get().recent.filter((u) => u.id !== user.id),
    ].slice(0, RECENT_USERS_MAX);
    set({ recent: next });
    await persist(next);
  },

  forget: async (id) => {
    const next = get().recent.filter((u) => u.id !== id);
    set({ recent: next });
    await persist(next);
  },

  clear: async () => {
    set({ recent: [] });
    await persist([]);
  },
}));

void useRecentUsersStore.getState().hydrate();
