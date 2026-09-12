import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { clampZoom, nextTapZoom } from "../../lib/zoom";

interface PhotoLightboxProps {
  uri: string | null;
  onClose: () => void;
}

/**
 * A photo over everything, on black. Pinch or double-tap to zoom, drag to
 * look around; the cross closes it.
 */
export function PhotoLightbox({ uri, onClose }: PhotoLightboxProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clampZoom(savedScale.value * e.scale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Back at 1× the photo slides home
      if (scale.value <= 1) {
        x.value = withTiming(0);
        y.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value <= 1) return;
      x.value = savedX.value + e.translationX;
      y.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = x.value;
      savedY.value = y.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = nextTapZoom(savedScale.value);
      scale.value = withTiming(next);
      savedScale.value = next;
      x.value = withTiming(0);
      y.value = withTiming(0);
      savedX.value = 0;
      savedY.value = 0;
    });

  const gesture = Gesture.Simultaneous(pinch, drag, doubleTap);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <Modal visible={!!uri} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* A Modal is its own window: gestures need their own root inside it */}
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={gesture}>
          <Animated.Image
            entering={FadeIn.duration(200)}
            source={{ uri: uri ?? undefined }}
            style={[styles.photo, photoStyle]}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            testID="lightbox-image"
          />
        </GestureDetector>

        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          style={[styles.close, { top: insets.top + 16 }]}
          testID="lightbox-close"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <View pointerEvents="none" style={[styles.hint, { bottom: insets.bottom + 16 }]}>
          <Text style={styles.hintText}>{t("spots.zoomHint")}</Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  photo: {
    flex: 1,
    width: "100%",
  },
  close: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
});
