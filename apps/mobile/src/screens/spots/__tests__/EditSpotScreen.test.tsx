import React from "react";
import { useDialogStore } from "../../../stores/dialog-store";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

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

jest.mock("../../../lib/api", () => ({
  updateSpot: jest.fn(),
  getSpotById: jest.fn(),
}));

jest.mock("../../../components/spots/CompositionBadge", () => ({
  CompositionBadge: ({ type }: { type: string }) => {
    const { Text } = require("react-native");
    return <Text>{type}</Text>;
  },
}));

import { useSpotsStore } from "../../../stores/spots-store";
import * as api from "../../../lib/api";
import type { Spot } from "../../../types";

const mockedApi = api as jest.Mocked<typeof api>;

// ─── Fixtures ───────────────────────────────────────────────────────

const SPOT: Spot = {
  id: "s1",
  userId: "owner-1",
  latitude: 48.85,
  longitude: 2.35,
  photoUrl: "https://cdn.example.com/photo.jpg",
  photoKey: "key-1",
  title: "Golden hour bridge",
  description: "A lovely sunset spot",
  isFree: true,
  visibility: "FOLLOWERS",
  colors: ["#C44536"],
  compositions: ["SYMMETRY"],
  customComposition: null,
  tags: ["sunset"],
  address: null,
  city: "Paris",
  country: "France",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

// ─── Helpers ────────────────────────────────────────────────────────

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigation = {
  goBack: mockGoBack,
  setOptions: mockSetOptions,
  navigate: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn().mockReturnValue(true),
  canGoBack: jest.fn().mockReturnValue(true),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn().mockReturnValue(jest.fn()),
  removeListener: jest.fn(),
  setParams: jest.fn(),
} as unknown as import("../../../navigation/types").RootStackScreenProps<"EditSpot">["navigation"];

const mockRoute = {
  key: "EditSpot-1",
  name: "EditSpot" as const,
  params: { spotId: "s1" },
};

function serveFetchSpot() {
  mockedApi.getSpotById.mockImplementation(
    () => Promise.resolve(SPOT),
  );
}

function serveUpdateSpot(result: Spot = SPOT) {
  mockedApi.updateSpot.mockImplementation(
    () => Promise.resolve(result),
  );
}

import { EditSpotScreen } from "../EditSpotScreen";

const renderScreen = () =>
  render(
    <EditSpotScreen
      route={mockRoute}
      navigation={mockNavigation}
    />,
  );

/**
 * Press the save button rendered in the navigation header.
 *
 * `useLayoutEffect` calls `navigation.setOptions({ headerRight: ... })`.
 * We extract the latest headerRight component and press it in isolation.
 */
async function pressSave() {
  const lastCall = mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1];
  const HeaderRight = lastCall[0].headerRight;
  expect(HeaderRight).toBeDefined();

  // Render the header component in its own tree to get a pressable node.
  const headerTree = await render(<HeaderRight />);
  await fireEvent.press(headerTree.getByText("common.save"));
}

// CI runners are slower — give module loading time.
jest.setTimeout(15_000);

// ─── Tests ──────────────────────────────────────────────────────────

describe("EditSpotScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDialogStore.setState({ queue: [] });
    serveFetchSpot();
    serveUpdateSpot();

    // Reset the store
    useSpotsStore.setState({
      spots: [],
      feedSpots: [],
      selectedSpot: null,
      isLoading: false,
      error: null,
      spotsCursor: null,
      feedCursor: null,
    });
  });

  it("pre-fills the form with the spot's data", async () => {
    await renderScreen();

    expect(await screen.findByDisplayValue("Golden hour bridge")).toBeTruthy();
    expect(screen.getByDisplayValue("A lovely sunset spot")).toBeTruthy();
  });

  it("calls updateSpot with edited title on save", async () => {
    const updatedSpot = { ...SPOT, title: "New title" };
    serveUpdateSpot(updatedSpot);

    await renderScreen();

    const titleInput = await screen.findByDisplayValue("Golden hour bridge");
    await fireEvent.changeText(titleInput, "New title");
    await pressSave();

    await waitFor(() => {
      expect(mockedApi.updateSpot).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({ title: "New title" }),
      );
    });
  });

  it("shows success alert after saving", async () => {
    serveUpdateSpot(SPOT);

    await renderScreen();
    await screen.findByDisplayValue("Golden hour bridge");
    await pressSave();

    await waitFor(() => {
      expect(useDialogStore.getState().queue[0]).toMatchObject({ kind: "notice", title: "spots.editSuccess" });
    });
  });

  it("shows error alert when update fails", async () => {
    mockedApi.updateSpot.mockImplementation(
      () => Promise.reject(new Error("Forbidden")),
    );

    await renderScreen();
    await screen.findByDisplayValue("Golden hour bridge");
    await pressSave();

    await waitFor(() => {
      expect(useDialogStore.getState().queue[0]).toMatchObject({
        kind: "notice",
        title: "common.error",
        message: "Forbidden",
      });
    });
  });

  it("navigates back on successful save", async () => {
    serveUpdateSpot(SPOT);

    await renderScreen();
    await screen.findByDisplayValue("Golden hour bridge");
    await pressSave();

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it("saves the accessibility level picked in the form", async () => {
    serveUpdateSpot({ ...SPOT, accessibility: "HARD" });

    await renderScreen();
    await screen.findByDisplayValue("Golden hour bridge");

    await fireEvent.press(screen.getByTestId("accessibility-HARD"));
    await pressSave();

    await waitFor(() => {
      expect(mockedApi.updateSpot).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({ accessibility: "HARD" }),
      );
    });
  });
});
