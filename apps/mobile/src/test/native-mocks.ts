/**
 * Stand-ins for the native gesture and animation runtimes, for tests that
 * render components built on them. Use from a `jest.mock` factory:
 *
 *   jest.mock("react-native-reanimated", () => require("../../test/native-mocks").reanimatedMock());
 *   jest.mock("react-native-gesture-handler", () => require("../../test/native-mocks").gestureHandlerMock());
 *
 * Animations resolve at once (`withTiming` calls its callback with
 * `finished: true`), and every gesture a `GestureDetector` mounts is kept
 * so a test can drive its handlers: `findGesture("pan").handlers.onEnd(e)`.
 */

import type { ReactNode } from "react";

type Handler = (event: Record<string, unknown>) => void;

export interface MockGesture {
  kind: string;
  handlers: Record<string, Handler>;
  gestures?: MockGesture[];
}

export function reanimatedMock() {
  const { useRef } = require("react");
  const { Image, View, Text, ScrollView } = require("react-native");
  const identity = (value: unknown) => value;
  return {
    __esModule: true,
    default: { Image, View, Text, ScrollView, createAnimatedComponent: identity },
    // One box per mount, like the real thing, so writes survive a re-render
    useSharedValue: (value: unknown) => useRef({ value }).current,
    useAnimatedStyle: (build: () => unknown) => build(),
    useAnimatedReaction: () => {},
    withTiming: (value: unknown, _config?: unknown, done?: (finished: boolean) => void) => {
      done?.(true);
      return value;
    },
    withSpring: identity,
    runOnJS: identity,
    interpolate: (value: number, input: number[], output: number[]) => {
      const [i0, i1] = input;
      const [o0, o1] = output;
      const t = i1 === i0 ? 0 : Math.min(1, Math.max(0, (value - i0) / (i1 - i0)));
      return o0 + (o1 - o0) * t;
    },
    Extrapolation: { CLAMP: "clamp", EXTEND: "extend" },
    Easing: {
      in: identity,
      out: identity,
      inOut: identity,
      cubic: identity,
      linear: identity,
      bezier: () => identity,
    },
  };
}

export function gestureHandlerMock() {
  const { View } = require("react-native");
  const mounted: MockGesture[] = [];

  const builder = (kind: string): MockGesture & Record<string, unknown> => {
    const gesture: MockGesture & Record<string, unknown> = { kind, handlers: {} };
    for (const name of ["onBegin", "onStart", "onUpdate", "onChange", "onEnd", "onFinalize"]) {
      gesture[name] = (fn: Handler) => {
        gesture.handlers[name] = fn;
        return gesture;
      };
    }
    for (const name of [
      "numberOfTaps",
      "minPointers",
      "maxPointers",
      "activeOffsetY",
      "failOffsetY",
      "activeOffsetX",
      "failOffsetX",
      "enabled",
      "hitSlop",
      "withRef",
      "runOnJS",
    ]) {
      gesture[name] = () => gesture;
    }
    return gesture;
  };
  const compose = (kind: string) => (...gestures: MockGesture[]) => ({ kind, handlers: {}, gestures });

  const flatten = (g: MockGesture): MockGesture[] => (g.gestures ? g.gestures.flatMap(flatten) : [g]);

  return {
    Gesture: {
      Pinch: () => builder("pinch"),
      Pan: () => builder("pan"),
      Tap: () => builder("tap"),
      Simultaneous: compose("simultaneous"),
      Race: compose("race"),
      Exclusive: compose("exclusive"),
    },
    GestureDetector: ({ gesture, children }: { gesture: MockGesture; children: ReactNode }) => {
      mounted.push(gesture);
      return children;
    },
    GestureHandlerRootView: View,
    /** The most recently mounted gesture of that kind. */
    findGesture: (kind: string): MockGesture | undefined =>
      mounted
        .flatMap(flatten)
        .filter((g) => g.kind === kind)
        .at(-1),
  };
}
