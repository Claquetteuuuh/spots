import React from "react";
import { Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

jest.mock("../../../theme", () => ({
  useTheme: () => ({
    dark: false,
    colors: { bg: "#FFFFFF", border: "#E5ECF8" },
  }),
}));

jest.mock("react-native-reanimated", () => require("../../../test/native-mocks").reanimatedMock());
jest.mock("react-native-gesture-handler", () => require("../../../test/native-mocks").gestureHandlerMock());

import { Drawer } from "../Drawer";

const { findGesture } = jest.requireMock("react-native-gesture-handler") as {
  findGesture: (kind: string) => { handlers: Record<string, (e: Record<string, unknown>) => void> };
};

describe("Drawer", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mount = (visible = true) =>
    render(
      <Drawer visible={visible} onClose={onClose} testID="sheet">
        <Text>Body</Text>
      </Drawer>,
    );

  it("shows its content with a grip to pull on", async () => {
    await mount();
    expect(screen.getByText("Body")).toBeTruthy();
    expect(screen.getByTestId("drawer-grip")).toBeTruthy();
    expect(screen.getByTestId("sheet")).toBeTruthy();
  });

  it("slides out and tells its owner from the backdrop", async () => {
    await mount();
    await fireEvent.press(screen.getByTestId("drawer-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes once pulled past a quarter of its height, or flicked", async () => {
    await mount();
    await act(async () => {
      fireEvent(screen.getByTestId("sheet"), "layout", { nativeEvent: { layout: { height: 400 } } });
    });
    const pull = findGesture("pan");

    await act(async () => {
      pull.handlers.onUpdate({ translationY: 60 });
      pull.handlers.onEnd({ translationY: 60, velocityY: 0 });
    });
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      pull.handlers.onEnd({ translationY: 160, velocityY: 0 });
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      pull.handlers.onEnd({ translationY: 30, velocityY: 1200 });
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
