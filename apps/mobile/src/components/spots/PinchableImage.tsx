import React from "react";
import type { ImageProps, ImageStyle, StyleProp } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { clampZoom } from "../../lib/zoom";

const SETTLE = { damping: 18, stiffness: 220 };

interface PinchableImageProps {
  uri: string;
  style: StyleProp<ImageStyle>;
  resizeMode?: ImageProps["resizeMode"];
  testID?: string;
}

/**
 * A photo that grows under a pinch right where it is, and settles back
 * when let go — no need to open it first. A tap still reaches whatever
 * wraps it.
 */
export function PinchableImage({ uri, style, resizeMode = "cover", testID }: PinchableImageProps) {
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const size = useSharedValue({ width: 1, height: 1 });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = clampZoom(e.scale);
      scale.value = next;
      // Keep the bit between the fingers where it is
      x.value = (e.focalX - size.value.width / 2) * (1 - next);
      y.value = (e.focalY - size.value.height / 2) * (1 - next);
    })
    .onEnd(() => {
      scale.value = withSpring(1, SETTLE);
      x.value = withSpring(0, SETTLE);
      y.value = withSpring(0, SETTLE);
    });

  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={pinch}>
      <Animated.Image
        source={{ uri }}
        style={[style, motion]}
        resizeMode={resizeMode}
        onLayout={(e) => {
          size.value = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
        }}
        accessibilityIgnoresInvertColors
        testID={testID}
      />
    </GestureDetector>
  );
}
