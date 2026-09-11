import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

// ─── Mocks ──────────────────────────────────────────────────────────

jest.mock("react-i18next", () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    initReactI18next: { type: "3rdParty", init: jest.fn() },
  };
});

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock("expo-camera", () => {
  const { View } = require("react-native");
  return { CameraView: View, useCameraPermissions: () => [{ granted: false }, jest.fn()] };
});

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: false, assets: [{ uri: "file:///photo-1.jpg" }] }),
  ),
}));

jest.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 48.8566, longitude: 2.3522 } }),
  ),
}));

jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return { WebView: View };
});

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View, Marker: View, PROVIDER_DEFAULT: null };
});

// The tabs are a pager: leaving the form means switching tab, not navigating.
const mockSetTabIndex = jest.fn();
jest.mock("../../../navigation/tab-context", () => ({
  useTabSwitch: () => ({ setTabIndex: mockSetTabIndex, activeIndex: 2 }),
}));

jest.mock("../../../lib/api", () => ({
  uploadPhoto: jest.fn(),
  discardUploads: jest.fn(() => Promise.resolve()),
  reverseGeocode: jest.fn(() =>
    Promise.resolve({ address: "1 rue de Paris", city: "Paris", country: "France" }),
  ),
  forwardGeocode: jest.fn(() => Promise.resolve([])),
  searchTags: jest.fn(() => Promise.resolve([])),
}));

import * as api from "../../../lib/api";
import { useAuthStore } from "../../../stores/auth-store";
import { useSpotsStore } from "../../../stores/spots-store";
import { AddSpotScreen } from "../AddSpotScreen";
import type { User } from "../../../types";

// ─── Fixtures ───────────────────────────────────────────────────────

const USER = { id: "owner-1", email: "a@b.c", username: "alice", name: "Alice" } as User;
const UPLOAD = { photoUrl: "https://cdn.example.com/p.jpg", photoKey: "spots/p.jpg" };

const mockedApi = api as jest.Mocked<typeof api>;
const mockCreateSpot = jest.fn();

// The wizard is five steps — give slow runners room.
jest.setTimeout(20_000);

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.uploadPhoto.mockResolvedValue(UPLOAD);
  mockCreateSpot.mockResolvedValue({ id: "s-new" });
  useAuthStore.setState({ user: USER });
  useSpotsStore.setState({ createSpot: mockCreateSpot });
});

// ─── Helpers ────────────────────────────────────────────────────────

/** Walk the wizard with the minimum each step requires, then submit. */
async function fillWizardAndSubmit() {
  await render(<AddSpotScreen />);

  // Step 0 — a photo from the gallery and the GPS position
  await fireEvent.press(screen.getByText("spots.pickPhoto"));
  await fireEvent.press(screen.getByText("map.locateMe"));
  // The reverse-geocoded address landing in the field means the location is set
  await screen.findByDisplayValue("1 rue de Paris");
  await fireEvent.press(screen.getByText("common.next"));

  // Step 1 — a colour
  await fireEvent.press(screen.getAllByLabelText(/^#[0-9A-F]{6}$/i)[0]);
  await fireEvent.press(screen.getByText("common.next"));

  // Step 2 — a composition
  await fireEvent.press(screen.getByText("compositions.SYMMETRY"));
  await fireEvent.press(screen.getByText("common.next"));

  // Steps 3 and 4 are optional
  await fireEvent.press(screen.getByText("common.next"));
  await fireEvent.press(screen.getByTestId("submit-spot"));
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("AddSpotScreen — submitting", () => {
  it("uploads, creates the spot and switches to the map tab", async () => {
    await fillWizardAndSubmit();

    await waitFor(() =>
      expect(mockCreateSpot).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 48.8566,
          longitude: 2.3522,
          photoUrl: UPLOAD.photoUrl,
          photoKey: UPLOAD.photoKey,
          compositions: ["SYMMETRY"],
        }),
      ),
    );
    // Regression: this used to be navigation.navigate("Map"), which no
    // navigator handles — the tabs are a pager.
    await waitFor(() => expect(mockSetTabIndex).toHaveBeenCalledWith(0));
  });

  it("stays on the form, shows the error and discards the uploads when creation fails", async () => {
    mockCreateSpot.mockRejectedValueOnce(new Error("Server down"));

    await fillWizardAndSubmit();

    await waitFor(() => expect(screen.getByText("Server down")).toBeTruthy());
    expect(mockSetTabIndex).not.toHaveBeenCalled();
    expect(mockedApi.discardUploads).toHaveBeenCalledWith([UPLOAD.photoKey]);
  });
});
