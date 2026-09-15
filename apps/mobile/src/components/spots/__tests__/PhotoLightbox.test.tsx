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

// ─── Stepping through a post's photos with a finger ──────────────────

describe("PhotoLightbox — swiping", () => {
  const URIS = ["https://cdn/1.webp", "https://cdn/2.webp", "https://cdn/3.webp"];

  /** The pan gesture the frame mounted, whichever way it is composed. */
  const panGesture = () => {
    const { findGesture } = require("react-native-gesture-handler") as {
      findGesture: (kind: string) => { handlers: Record<string, (e: unknown) => void> };
    };
    return findGesture("pan");
  };

  async function show(index = 1, uris = URIS) {
    const onIndexChange = jest.fn();
    await render(
      <PhotoLightbox
        uri={uris[index]}
        uris={uris}
        index={index}
        onIndexChange={onIndexChange}
        onClose={jest.fn()}
      />,
    );
    return onIndexChange;
  }

  /** Drag across the screen and let go. */
  const drag = (translationX: number, velocityX = 0) => {
    const pan = panGesture();
    pan.handlers.onUpdate?.({ translationX, translationY: 0 });
    pan.handlers.onEnd?.({ translationX, translationY: 0, velocityX });
  };

  it("goes to the next photo when dragged to the left", async () => {
    const onIndexChange = await show(1);

    drag(-120);

    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it("goes back when dragged to the right, and wraps around", async () => {
    const onIndexChange = await show(0);

    drag(150);

    expect(onIndexChange).toHaveBeenCalledWith(URIS.length - 1);
  });

  it("takes a flick, even a short one", async () => {
    const onIndexChange = await show(0);

    drag(-30, -900);

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("stays put when the finger barely moved — that is a tap, not a swipe", async () => {
    const onIndexChange = await show(1);

    drag(-20, 0);

    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("leaves a lone photo alone, however far it is dragged", async () => {
    const onIndexChange = await show(0, ["https://cdn/only.webp"]);

    drag(-200, -900);

    expect(onIndexChange).not.toHaveBeenCalled();
  });
});
