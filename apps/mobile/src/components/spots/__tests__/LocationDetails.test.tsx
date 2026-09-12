import React from "react";
import { Linking } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

import * as Clipboard from "expo-clipboard";
import { LocationDetails } from "../LocationDetails";

describe("LocationDetails", () => {
  const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the address over small coordinates, and directions for three apps", async () => {
    await render(<LocationDetails latitude={48.856614} longitude={2.3522219} address="12 quai de Seine, Paris" />);

    expect(screen.getByText("12 quai de Seine, Paris")).toBeTruthy();
    const coords = screen.getByText("48.85661, 2.35222");
    expect(coords.props.style.fontSize).toBe(11);

    await fireEvent.press(screen.getByTestId("open-waze"));
    expect(openURL).toHaveBeenCalledWith("https://waze.com/ul?ll=48.856614,2.3522219&navigate=yes");
    await fireEvent.press(screen.getByTestId("open-google"));
    expect(openURL).toHaveBeenLastCalledWith("https://www.google.com/maps/dir/?api=1&destination=48.856614,2.3522219");
    await fireEvent.press(screen.getByTestId("open-apple"));
    expect(openURL).toHaveBeenLastCalledWith("https://maps.apple.com/?daddr=48.856614,2.3522219");
  });

  it("copies the address or the coordinates on a tap and says so", async () => {
    await render(<LocationDetails latitude={48.856614} longitude={2.3522219} address="12 quai de Seine, Paris" />);

    await fireEvent.press(screen.getByTestId("copy-address"));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith("12 quai de Seine, Paris");
    await waitFor(() => expect(screen.getByText("common.copied")).toBeTruthy());

    await fireEvent.press(screen.getByTestId("copy-coordinates"));
    expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith("48.85661, 2.35222");
  });

  it("copes without an address", async () => {
    await render(<LocationDetails latitude={1} longitude={2} address={null} />);
    expect(screen.queryByTestId("copy-address")).toBeNull();
    expect(screen.getByText("1.00000, 2.00000")).toBeTruthy();
  });
});
