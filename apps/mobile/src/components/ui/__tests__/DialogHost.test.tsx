import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import { DialogHost } from "../DialogHost";
import { confirmDialog, noticeDialog, useDialogStore } from "../../../stores/dialog-store";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

jest.mock("react-native-reanimated", () => require("../../../test/native-mocks").reanimatedMock());

jest.mock("../../../theme", () => ({
  useTheme: () => ({
    dark: false,
    colors: {
      bg: "#FFFFFF",
      accent: "#4574C4",
      onAccent: "#FFFFFF",
      error: "#D14343",
      text: "#16203A",
      textSecondary: "#5B6478",
      border: "#E5ECF8",
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    typography: {
      size: { xs: 12, sm: 13, base: 15, md: 16, lg: 18 },
      weight: { medium: "500", semibold: "600", bold: "700" },
      lineHeight: { relaxed: 1.5 },
    },
    radius: { sm: 8, md: 12 },
  }),
}));

const buttonColor = (testID: string) =>
  ([screen.getByTestId(testID).props.style].flat(Infinity) as { backgroundColor?: string }[])
    .map((s) => s?.backgroundColor)
    .find(Boolean);

beforeEach(() => {
  useDialogStore.setState({ queue: [] });
});

describe("DialogHost", () => {
  it("shows nothing until asked", async () => {
    await render(<DialogHost />);
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("asks the question and resolves true from the blue button", async () => {
    await render(<DialogHost />);
    let answer!: Promise<boolean>;
    await act(async () => {
      answer = confirmDialog({ title: "Change name?", message: "Your URL changes too", confirmLabel: "Save" });
    });

    expect(screen.getByText("Change name?")).toBeTruthy();
    expect(screen.getByText("Your URL changes too")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("common.cancel")).toBeTruthy();
    expect(buttonColor("dialog-confirm")).toBe("#4574C4");

    await fireEvent.press(screen.getByTestId("dialog-confirm"));
    await expect(answer).resolves.toBe(true);
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("paints a destructive question red and resolves false on cancel", async () => {
    await render(<DialogHost />);
    let answer!: Promise<boolean>;
    await act(async () => {
      answer = confirmDialog({ title: "Delete?", destructive: true, confirmLabel: "Delete" });
    });
    expect(buttonColor("dialog-confirm")).toBe("#D14343");

    await fireEvent.press(screen.getByTestId("dialog-cancel"));
    await expect(answer).resolves.toBe(false);
  });

  it("resolves false from a tap beside the card", async () => {
    await render(<DialogHost />);
    let answer!: Promise<boolean>;
    await act(async () => {
      answer = confirmDialog({ title: "Leave?" });
    });
    await fireEvent.press(screen.getByTestId("dialog-backdrop"));
    await expect(answer).resolves.toBe(false);
  });

  it("shows a notice with a single OK", async () => {
    await render(<DialogHost />);
    let done!: Promise<void>;
    await act(async () => {
      done = noticeDialog({ title: "Saved" });
    });
    expect(screen.queryByTestId("dialog-cancel")).toBeNull();
    expect(screen.getByText("common.ok")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("dialog-confirm"));
    await expect(done).resolves.toBeUndefined();
  });

  it("shows dialogs one at a time, in order", async () => {
    await render(<DialogHost />);
    await act(async () => {
      void confirmDialog({ title: "First" });
      void confirmDialog({ title: "Second" });
    });
    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.queryByText("Second")).toBeNull();

    await fireEvent.press(screen.getByTestId("dialog-confirm"));
    expect(screen.getByText("Second")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("dialog-cancel"));
    expect(screen.queryByTestId("dialog")).toBeNull();
  });
});
