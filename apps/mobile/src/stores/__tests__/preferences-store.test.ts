const mockStore: Record<string, string> = {};
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn((k: string, v: string) => {
    mockStore[k] = v;
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((k: string) => Promise.resolve(mockStore[k] ?? null)),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from "expo-secure-store";
import { usePreferencesStore } from "../preferences-store";

describe("preferences store — live position", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    usePreferencesStore.setState({ livePosition: true, hydrated: false });
  });

  it("is on by default and hydrates to what was saved", async () => {
    await usePreferencesStore.getState().hydrate();
    expect(usePreferencesStore.getState()).toMatchObject({ livePosition: true, hydrated: true });

    mockStore["spots.livePosition"] = "off";
    await usePreferencesStore.getState().hydrate();
    expect(usePreferencesStore.getState().livePosition).toBe(false);
  });

  it("applies a change at once and persists it", async () => {
    await usePreferencesStore.getState().setLivePosition(false);

    expect(usePreferencesStore.getState().livePosition).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("spots.livePosition", "off");
  });

  it("keeps working when the store cannot be written", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error("no keychain"));

    await usePreferencesStore.getState().setLivePosition(false);

    expect(usePreferencesStore.getState().livePosition).toBe(false);
  });
});
