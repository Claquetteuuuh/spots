const mockStore: Record<string, string> = {};
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn((k: string, v: string) => {
    mockStore[k] = v;
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((k: string) => Promise.resolve(mockStore[k] ?? null)),
  deleteItemAsync: jest.fn(),
}));

import { RECENT_USERS_MAX, useRecentUsersStore } from "../recent-users-store";

const u = (id: string) => ({ id, username: id, name: id.toUpperCase(), avatarUrl: null });

describe("recent users store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    useRecentUsersStore.setState({ recent: [], hydrated: false });
  });

  it("remembers most recent first, without duplicates, capped", async () => {
    const store = useRecentUsersStore.getState();
    await store.remember(u("a"));
    await store.remember(u("b"));
    await store.remember(u("a"));
    expect(useRecentUsersStore.getState().recent.map((x) => x.id)).toEqual(["a", "b"]);

    for (let i = 0; i < RECENT_USERS_MAX + 3; i++) await store.remember(u(`n${i}`));
    expect(useRecentUsersStore.getState().recent).toHaveLength(RECENT_USERS_MAX);
  });

  it("forgets one, clears all, and persists every change", async () => {
    const store = useRecentUsersStore.getState();
    await store.remember(u("a"));
    await store.remember(u("b"));
    await store.forget("a");
    expect(useRecentUsersStore.getState().recent.map((x) => x.id)).toEqual(["b"]);
    expect(JSON.parse(mockStore["spots.recentUsers"]).map((x: { id: string }) => x.id)).toEqual(["b"]);

    await store.clear();
    expect(useRecentUsersStore.getState().recent).toEqual([]);
  });

  it("hydrates from what was saved and ignores junk", async () => {
    mockStore["spots.recentUsers"] = JSON.stringify([u("a"), "junk", { nope: true }]);
    await useRecentUsersStore.getState().hydrate();
    expect(useRecentUsersStore.getState()).toMatchObject({ hydrated: true });
    expect(useRecentUsersStore.getState().recent.map((x) => x.id)).toEqual(["a"]);
  });
});
