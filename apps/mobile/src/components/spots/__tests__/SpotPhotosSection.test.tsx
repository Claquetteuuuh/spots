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

// Every photo is shrunk on the phone before it goes up; the native module
// is not there in a test, so it answers with a file of its own.
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: jest.fn(),
      renderAsync: jest.fn(async () => ({
        saveAsync: jest.fn(async () => ({ uri: "file:///small.jpg" })),
      })),
    })),
  },
}));

// The lightbox is built on gestures and reanimated: neither has a native
// side in a test.
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 10, left: 0, right: 0 }),
}));
jest.mock("react-native-gesture-handler", () => require("../../../test/native-mocks").gestureHandlerMock());
jest.mock("react-native-reanimated", () => require("../../../test/native-mocks").reanimatedMock());

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../../lib/api", () => ({
  getSpotPhotos: jest.fn(),
  addSpotPhoto: jest.fn(),
  deleteSpotPhoto: jest.fn(),
  searchUsers: jest.fn(async () => []),
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
    caption: "Golden hour",
    createdAt: "2026-09-11T10:00:00.000Z",
    images: [{ id: "i1", photoUrl: "https://cdn.example.com/p1.webp" }],
    mentions: [],
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

function pickerReturns(...assets: { uri: string; fileName: string }[]) {
  mockedPicker.launchImageLibraryAsync.mockResolvedValueOnce({
    canceled: false,
    assets,
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

    expect(await screen.findByTestId("post-photo-p1-0")).toBeTruthy();
    expect(mockedApi.getSpotPhotos).toHaveBeenCalledWith("s1");
  });

  it("loads the next page on demand", async () => {
    servePhotos({
      first: { items: [photo()], nextCursor: "p1" },
      p1: { items: [photo({ id: "p2" })], nextCursor: null },
    });

    await renderSection();

    await fireEvent.press(await screen.findByText("common.next"));

    expect(await screen.findByTestId("post-photo-p2-0")).toBeTruthy();
    expect(mockedApi.getSpotPhotos).toHaveBeenLastCalledWith("s1", "p1");
    expect(screen.queryByText("common.next")).toBeNull();
  });

  it("reads top to bottom: the author, then the text, then the photos", async () => {
    servePhotos({ first: { items: [photo()], nextCursor: null } });

    await renderSection();

    // The author sits above the post, the caption above its photos
    expect(await screen.findByTestId("post-author-p1")).toBeTruthy();
    expect(screen.getByText("bob")).toBeTruthy();
    expect(screen.getByTestId("post-caption-p1")).toBeTruthy();
    expect(screen.getByText("Golden hour")).toBeTruthy();
  });

  it("fans out every photo of a post and opens the one tapped", async () => {
    servePhotos({
      first: {
        items: [
          photo({
            images: [
              { id: "i1", photoUrl: "https://cdn/1.webp" },
              { id: "i2", photoUrl: "https://cdn/2.webp" },
              { id: "i3", photoUrl: "https://cdn/3.webp" },
            ],
          }),
        ],
        nextCursor: null,
      },
    });

    await renderSection();

    // One card per photo, the first in front
    expect(await screen.findByTestId("post-photo-p1-0")).toBeTruthy();
    expect(screen.getByTestId("post-photo-p1-2")).toBeTruthy();

    // Tapping the second card opens the pile at that photo
    await fireEvent.press(screen.getByTestId("post-photo-p1-1"));
    expect(screen.getByTestId("lightbox-image").props.source).toEqual({ uri: "https://cdn/2.webp" });

    // …and the arrows walk the rest
    await fireEvent.press(screen.getByTestId("lightbox-next"));
    expect(screen.getByTestId("lightbox-image").props.source).toEqual({ uri: "https://cdn/3.webp" });
  });

  it("opens the profile of someone the caption names", async () => {
    servePhotos({
      first: {
        items: [
          photo({
            caption: "shot with @alice",
            mentions: [{ id: "u2", username: "alice" }],
          }),
        ],
        nextCursor: null,
      },
    });

    await renderSection();

    await fireEvent.press(await screen.findByText("@alice"));

    expect(mockNavigate).toHaveBeenCalledWith("OtherProfile", { username: "alice" });
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

      await waitFor(() => expect(screen.queryByTestId("post-photo-p1-0")).toBeNull());
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

      await screen.findByTestId("post-photo-p1-0");
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
      expect(screen.getByTestId("post-photo-p1-0")).toBeTruthy();
    });
  });

  describe("adding", () => {
    it("posts every photo picked, shrunk on the phone, with its caption", async () => {
      servePhotos({ first: { items: [photo()], nextCursor: null } });
      pickerReturns(
        { uri: "file:///new.jpg", fileName: "new.jpg" },
        { uri: "file:///other.jpg", fileName: "other.jpg" },
      );
      mockedApi.addSpotPhoto.mockResolvedValueOnce(
        photo({ id: "p9", userId: "viewer-1", caption: "Blue hour" }),
      );
      await renderSection();
      await screen.findByTestId("post-photo-p1-0");

      await fireEvent.press(screen.getByTestId("add-spot-photo"));
      await fireEvent.changeText(await screen.findByTestId("spot-photo-caption"), "Blue hour");
      await fireEvent.press(screen.getByTestId("submit-spot-photo"));

      expect(await screen.findByTestId("post-photo-p9-0")).toBeTruthy();
      // Both photos go up, and it is the re-encoded file that travels,
      // not the 12 MP original the phone handed over.
      expect(mockedApi.addSpotPhoto).toHaveBeenCalledWith(
        "s1",
        [
          { uri: "file:///small.jpg", fileName: "new.jpg" },
          { uri: "file:///small.jpg", fileName: "other.jpg" },
        ],
        "Blue hour",
      );
    });

    it("drops a photo taken back out of the selection", async () => {
      pickerReturns(
        { uri: "file:///a.jpg", fileName: "a.jpg" },
        { uri: "file:///b.jpg", fileName: "b.jpg" },
      );
      mockedApi.addSpotPhoto.mockResolvedValueOnce(photo({ id: "p9", userId: "viewer-1" }));
      await renderSection();
      await screen.findByText("spotPhotos.noPhotos");

      await fireEvent.press(screen.getByTestId("add-spot-photo"));
      await fireEvent.press(await screen.findByTestId("remove-pending-0"));
      await fireEvent.press(screen.getByTestId("submit-spot-photo"));

      expect(mockedApi.addSpotPhoto).toHaveBeenCalledWith(
        "s1",
        [{ uri: "file:///small.jpg", fileName: "b.jpg" }],
        undefined,
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
      pickerReturns({ uri: "file:///new.jpg", fileName: "new.jpg" });
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
