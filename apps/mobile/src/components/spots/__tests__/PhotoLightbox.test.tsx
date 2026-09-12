import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 10, left: 0, right: 0 }),
}));

jest.mock("react-native-gesture-handler", () => require("../../../test/native-mocks").gestureHandlerMock());
jest.mock("react-native-reanimated", () => require("../../../test/native-mocks").reanimatedMock());

import { PhotoLightbox } from "../PhotoLightbox";

describe("PhotoLightbox", () => {
  it("shows nothing without a photo", async () => {
    await render(<PhotoLightbox uri={null} onClose={jest.fn()} />);
    expect(screen.queryByTestId("lightbox-image")).toBeNull();
  });

  it("fills the screen with the photo at 1× and closes from the cross", async () => {
    const onClose = jest.fn();
    await render(<PhotoLightbox uri="https://cdn/a.webp" onClose={onClose} />);

    const image = screen.getByTestId("lightbox-image");
    expect(image.props.source).toEqual({ uri: "https://cdn/a.webp" });
    const style = Object.assign({}, ...[image.props.style].flat(Infinity).filter(Boolean));
    expect(style.transform).toEqual([{ translateX: 0 }, { translateY: 0 }, { scale: 1 }]);
    expect(screen.getByText("spots.zoomHint")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("lightbox-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
