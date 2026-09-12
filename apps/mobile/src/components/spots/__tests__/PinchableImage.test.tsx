import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

jest.mock("react-native-reanimated", () => require("../../../test/native-mocks").reanimatedMock());
jest.mock("react-native-gesture-handler", () => require("../../../test/native-mocks").gestureHandlerMock());

import { PinchableImage } from "../PinchableImage";

const { findGesture } = jest.requireMock("react-native-gesture-handler") as {
  findGesture: (kind: string) => { handlers: Record<string, (e: Record<string, unknown>) => void> };
};

const transformOf = () => {
  const style = Object.assign({}, ...[screen.getByTestId("photo").props.style].flat(Infinity).filter(Boolean));
  return style.transform as { translateX?: number; translateY?: number; scale?: number }[];
};

describe("PinchableImage", () => {
  // A fresh element each time: re-rendering the very same one lets React skip the work
  const element = () => <PinchableImage uri="https://cdn/a.webp" style={{ width: 200, height: 200 }} testID="photo" />;

  it("sits at 1× until pinched", async () => {
    await render(element());
    expect(screen.getByTestId("photo").props.source).toEqual({ uri: "https://cdn/a.webp" });
    expect(transformOf()).toEqual([{ translateX: 0 }, { translateY: 0 }, { scale: 1 }]);
  });

  it("grows around the fingers, never past the cap, and settles back when let go", async () => {
    const view = await render(element());
    await act(async () => {
      fireEvent(screen.getByTestId("photo"), "layout", { nativeEvent: { layout: { width: 200, height: 200 } } });
    });
    const pinch = findGesture("pinch");

    await act(async () => {
      pinch.handlers.onUpdate({ scale: 2, focalX: 150, focalY: 100 });
    });
    await view.rerender(element());
    // The point between the fingers (50px right of centre) stays put
    // (-0 for a centred finger is still zero)
    expect(transformOf()).toEqual([{ translateX: -50 }, { translateY: expect.closeTo(0) }, { scale: 2 }]);

    await act(async () => {
      pinch.handlers.onUpdate({ scale: 9, focalX: 100, focalY: 100 });
    });
    await view.rerender(element());
    expect(transformOf()[2]).toEqual({ scale: 4 });

    await act(async () => {
      pinch.handlers.onEnd({});
    });
    await view.rerender(element());
    expect(transformOf()).toEqual([{ translateX: 0 }, { translateY: 0 }, { scale: 1 }]);
  });
});
