import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));

jest.mock("../../../lib/api", () => ({ getActivity: jest.fn() }));

import * as api from "../../../lib/api";
import { ActivityScreen } from "../ActivityScreen";

const mockedApi = api as jest.Mocked<typeof api>;

const spot = (id: string, title: string | null = "Seine at dusk") => ({
  id,
  title,
  photoUrl: `https://cdn/${id}.webp`,
  city: "Paris",
  country: "France",
  userId: "u2",
  user: { id: "u2", username: "bob", name: "Bob", avatarUrl: null },
});

jest.setTimeout(15_000);

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.getActivity.mockImplementation(async (type) =>
    type === "likes"
      ? {
          items: [
            { id: "l1", createdAt: "2026-01-01", spot: spot("s1") },
            { id: "l2", createdAt: "2026-01-01", spot: spot("s2", null) },
          ],
          nextCursor: null,
        }
      : {
          items: [{ id: "p1", photoUrl: "https://cdn/p1.webp", caption: "Golden hour", createdAt: "2026-01-01", spot: spot("s9") }],
          nextCursor: null,
        },
  );
});

describe("ActivityScreen", () => {
  it("opens on the liked spots and opens a spot from its row", async () => {
    await render(<ActivityScreen />);
    await screen.findByTestId("activity-l1");

    expect(mockedApi.getActivity).toHaveBeenCalledWith("likes", undefined);
    expect(screen.getByText("Seine at dusk")).toBeTruthy();
    expect(screen.getByText("spots.untitled")).toBeTruthy();
    expect(screen.getAllByText("Paris, France · @bob")).toHaveLength(2);

    await fireEvent.press(screen.getByTestId("activity-l1"));
    expect(mockNavigate).toHaveBeenCalledWith("SpotDetail", { spotId: "s1" });
  });

  it("switches to the photos, showing the caption and the spot it sits on", async () => {
    await render(<ActivityScreen />);
    await screen.findByTestId("activity-l1");

    await fireEvent.press(screen.getByTestId("activity-tab-photos"));
    await screen.findByTestId("activity-p1");
    expect(mockedApi.getActivity).toHaveBeenLastCalledWith("photos", undefined);
    expect(screen.getByText("Golden hour")).toBeTruthy();
    expect(screen.getByText("settings.activityOn Seine at dusk · @bob")).toBeTruthy();
    expect(screen.queryByTestId("activity-l1")).toBeNull();
  });

  it("says so when there is nothing yet", async () => {
    mockedApi.getActivity.mockResolvedValue({ items: [], nextCursor: null });
    await render(<ActivityScreen />);
    await waitFor(() => expect(screen.getByText("settings.activityEmptyLikes")).toBeTruthy());
  });
});
