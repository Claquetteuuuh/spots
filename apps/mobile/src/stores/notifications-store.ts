import { create } from "zustand";
import * as api from "../lib/api";

interface NotificationsState {
  /** Unseen follow requests and new followers — what the tab badge shows. */
  badgeCount: number;
  refresh: () => Promise<void>;
  /** The notifications screen has loaded: drop the badge now, tell the server for next time. */
  markSeen: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  badgeCount: 0,

  refresh: async () => {
    try {
      set({ badgeCount: await api.getFollowRequestsCount() });
    } catch {
      // Keep the last count; the next poll tries again
    }
  },

  markSeen: async () => {
    set({ badgeCount: 0 });
    try {
      await api.markNotificationsSeen();
    } catch {
      // The badge is already gone on screen; the server catches up next time
    }
  },
}));
