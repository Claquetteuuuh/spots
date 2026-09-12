import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

/**
 * Device-side preferences: things that belong to this phone rather than
 * the account, like whether the map may use its sensors.
 */

const LIVE_POSITION_KEY = "spots.livePosition";

interface PreferencesState {
  /** Whether the map shows the photographer's live position. On unless turned off. */
  livePosition: boolean;
  hydrated: boolean;
  setLivePosition: (enabled: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>()((set) => ({
  livePosition: true,
  hydrated: false,

  setLivePosition: async (enabled) => {
    set({ livePosition: enabled });
    try {
      await SecureStore.setItemAsync(LIVE_POSITION_KEY, enabled ? "on" : "off");
    } catch {
      // The choice just won't survive a restart
    }
  },

  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(LIVE_POSITION_KEY);
      set({ livePosition: saved !== "off", hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));

// Read the saved choices as soon as the store is first imported
void usePreferencesStore.getState().hydrate();
