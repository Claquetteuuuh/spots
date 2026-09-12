import React, { act } from "react";
import { useDialogStore } from "../../../stores/dialog-store";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { SpotPhotosSection } from "../SpotPhotosSection";
import { useAuthStore } from "../../../stores/auth-store";
import * as api from "../../../lib/api";
import type { Paginated, SpotPhoto, User } from "../../../types";

// Testing Library for React Native is async by default since v14:
// `render` and `fireEvent.*` must be awaited.
// React 19's `act` must wrap callbacks that trigger state updates
// outside of React's own scheduling (e.g. Alert mock onPress handlers).

jest.mock("react-i18next", () => {
  // One `t` for the whole run: the real hook keeps it stable across renders,
  // and effects that list it as a dependency rely on that.
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    // lib/i18n.ts registers this plugin at import time (pulled in via the stores)
    initReactI18next: { type: "3rdParty", init: jest.fn() },
  };
});

// The real icon set loads its font asynchronously and keeps running after
// the test ends; a host component name renders the same tree without it.
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock("../../../lib/api", () => ({
  getSpotPhotos: jest.fn(),
  addSpotPhoto: jest.fn(),
  deleteSpotPhoto: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;
const mockedPicker = ImagePicker as jest.Mocked<typeof ImagePicker>;

const OWNER_ID = "owner-1";
const EMPTY: Paginated<SpotPhoto> = { items: [], nextCursor: null };

function signIn(id: string) {
  useAuthStore.setState({
    user: { id, username: `user-${id}`, name: `User ${id}`, avatarUrl: null } as unknown as User,
  });
}

function photo(over: Partial<SpotPhoto> = {}): SpotPhoto {
  return {
    id: "p1",
    spotId: "s1",
    userId: "author-1",
    photoUrl: "https://cdn.example.com/p1.webp",
    photoKey: "spots/author-1/p1.webp",
    caption: "Golden hour",
    createdAt: "2026-09-11T10:00:00.000Z",
    user: { id: "author-1", username: "bob", name: "Bob", avatarUrl: null },
    ...over,
  };
}

/**
 * Serve pages by cursor — the first page under `first`.
 *
 * Returns pre-resolved promises (`Promise.resolve`) rather than `async`
 * functions. An `async () => value` wraps the return in an extra promise
 * via the async-function machinery; in CI's slower runners that extra
 * microtask hop deadlocks with React 19's act — RNTL v14 wraps render
 * and findBy* in act, which detects the pending microtask but blocks
 * the event loop that would flush it, causing a 5s timeout.
 */
function servePhotos(pages: Record<string, Paginated<SpotPhoto>>) {
  mockedApi.getSpotPhotos.mockImplementation(
    (_spotId: string, cursor?: string) => Promise.resolve(pages[cursor ?? "first"] ?? EMPTY),
  );
}

function pickerReturns(uri: string, fileName: string) {
  mockedPicker.launchImageLibraryAsync.mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri, fileName }],
  } as unknown as ImagePicker.ImagePickerResult);
}

const renderSection = () => render(<SpotPhotosSection spotId="s1" ownerId={OWNER_ID} />);

/**
 * Press the destructive button of the last confirmation dialog.
 * Wrapped in `act` because the `onPress` callback triggers state
 * updates (`setDeletingId`, `setPhotos`, …) outside React's scheduler.
 */
const topDialog = () => useDialogStore.getState().queue[0];

async function confirmLastAlert() {
  await act(async () => {
    useDialogStore.getState().settle(topDialog().id, true);
  });
}

// CI runners are slower — the first render loads modules lazily and
// React 19's act may need more time to flush all work.
jest.setTimeout(15_000);

describe("SpotPhotosSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDialogStore.setState({ queue: [] });
    signIn("viewer-1");
    servePhotos({});
  });

  // The empty-state test runs first: its render triggers the same module
  // loading as the data test but with a minimal state delta (only
  // `isLoading` changes), so act finishes quickly and warms the module
  // cache for subsequent tests.
  it("shows the empty message when nobody has added a photo", async () => {
    await renderSection();
    expect(await screen.findByText("spotPhotos.noPhotos")).toBeTruthy();
  });

  it("lists the spot's community photos", async () => {
    servePhotos({ first: { items: [photo()], nextCursor: null } });

    await renderSection();

    expect(await screen.findByTestId("spot-photo-p1")).toBeTruthy();
    expect(mockedApi.getSpotPhotos).toHaveBeenCalledWith("s1");
  });

  it("loads the next page on demand", async () => {
    servePhotos({
      first: { items: [photo()], nextCursor: "p1" },
      p1: { items: [photo({ id: "p2" })], nextCursor: null },
    });

    await renderSection();

    await fireEvent.press(await screen.findByText("common.next"));

    expect(await screen.findByTestId("spot-photo-p2")).toBeTruthy();
    expect(mockedApi.getSpotPhotos).toHaveBeenLastCalledWith("s1", "p1");
    expect(screen.queryByText("common.next")).toBeNull();
  });

  it("opens a preview with the author and caption when a tile is tapped", async () => {
    servePhotos({ first: { items: [photo()], nextCursor: null } });
    await renderSection();

    await fireEvent.press(await screen.findByTestId("spot-photo-p1"));

    expect(screen.getByText("bob")).toBeTruthy();
    expect(screen.getByText("Golden hour")).toBeTruthy();
  });

  describe("deleting", () => {
    it("lets the photo's author delete it after confirming", async () => {
      signIn("author-1");
      servePhotos({ first: { items: [photo()], nextCursor: null } });
      mockedApi.deleteSpotPhoto.mockResolvedValueOnce(undefined);
      await renderSection();

      await fireEvent.press(await screen.findByTestId("delete-spot-photo-p1"));
      expect(topDialog()).toMatchObject({
        kind: "confirm",
        title: "spotPhotos.deletePhoto",
        message: "spotPhotos.deleteConfirm",
        destructive: true,
      });
      expect(mockedApi.deleteSpotPhoto).not.toHaveBeenCalled();

      await confirmLastAlert();

      await waitFor(() => expect(screen.queryByTestId("spot-photo-p1")).toBeNull());
      expect(mockedApi.deleteSpotPhoto).toHaveBeenCalledWith("s1", "p1");
    });

    it("lets the spot's owner delete anyone's photo", async () => {
      signIn(OWNER_ID);
      servePhotos({ first: { items: [photo()], nextCursor: null } });
      await renderSection();

      expect(await screen.findByTestId("delete-spot-photo-p1")).toBeTruthy();
    });

    it("offers no delete to other viewers", async () => {
      servePhotos({ first: { items: [photo()], nextCursor: null } });
      await renderSection();

      await screen.findByTestId("spot-photo-p1");
      expect(screen.queryByTestId("delete-spot-photo-p1")).toBeNull();
    });

    it("keeps the photo and reports the error when the API refuses", async () => {
      signIn("author-1");
      servePhotos({ first: { items: [photo()], nextCursor: null } });
      mockedApi.deleteSpotPhoto.mockRejectedValueOnce(new Error("boom"));
      await renderSection();

      await fireEvent.press(await screen.findByTestId("delete-spot-photo-p1"));
      await confirmLastAlert();

      await waitFor(() =>
        expect(topDialog()).toMatchObject({ kind: "notice", title: "common.error" }),
      );
      expect(screen.getByTestId("spot-photo-p1")).toBeTruthy();
    });
  });

  describe("adding", () => {
    it("uploads the picked photo with its caption and shows it first", async () => {
      servePhotos({ first: { items: [photo()], nextCursor: null } });
      pickerReturns("file:///new.jpg", "new.jpg");
      mockedApi.addSpotPhoto.mockResolvedValueOnce(
        photo({ id: "p9", userId: "viewer-1", caption: "Blue hour" }),
      );
      await renderSection();
      await screen.findByTestId("spot-photo-p1");

      await fireEvent.press(screen.getByTestId("add-spot-photo"));
      await fireEvent.changeText(await screen.findByTestId("spot-photo-caption"), "Blue hour");
      await fireEvent.press(screen.getByTestId("submit-spot-photo"));

      expect(await screen.findByTestId("spot-photo-p9")).toBeTruthy();
      expect(mockedApi.addSpotPhoto).toHaveBeenCalledWith(
        "s1",
        "file:///new.jpg",
        "Blue hour",
        "new.jpg",
      );
    });

    it("does nothing when the picker is cancelled", async () => {
      await renderSection();
      await screen.findByText("spotPhotos.noPhotos");

      await fireEvent.press(screen.getByTestId("add-spot-photo"));

      await waitFor(() => expect(mockedPicker.launchImageLibraryAsync).toHaveBeenCalled());
      expect(screen.queryByTestId("spot-photo-caption")).toBeNull();
      expect(mockedApi.addSpotPhoto).not.toHaveBeenCalled();
    });

    it("reports an upload failure and keeps the form open", async () => {
      pickerReturns("file:///new.jpg", "new.jpg");
      mockedApi.addSpotPhoto.mockRejectedValueOnce(new Error("too big"));
      await renderSection();
      await screen.findByText("spotPhotos.noPhotos");

      await fireEvent.press(screen.getByTestId("add-spot-photo"));
      await fireEvent.press(await screen.findByTestId("submit-spot-photo"));

      await waitFor(() =>
        expect(topDialog()).toMatchObject({ kind: "notice", title: "common.error" }),
      );
      expect(screen.getByTestId("spot-photo-caption")).toBeTruthy();
    });
  });
});
