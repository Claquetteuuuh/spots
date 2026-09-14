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
  /** A post's photos, when there is more than one to step through. */
  uris?: string[];
  index?: number;
  onIndexChange?: (index: number) => void;
}

/**
 * A photo over everything, on black. Pinch or double-tap to zoom, drag to
 * look around; the cross closes it.
 */
export function PhotoLightbox({
  uri,
  onClose,
  uris = [],
  index = 0,
  onIndexChange,
}: PhotoLightboxProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const count = uris.length;
  const step = (by: number) => onIndexChange?.((index + by + count) % count);

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

        {count > 1 ? (
          <>
            <Pressable
              onPress={() => step(-1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common.previous")}
              style={[styles.step, styles.stepLeft]}
              testID="lightbox-previous"
            >
              <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => step(1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common.next")}
              style={[styles.step, styles.stepRight]}
              testID="lightbox-next"
            >
              <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
            </Pressable>
            <View pointerEvents="none" style={[styles.counter, { top: insets.top + 16 }]}>
              <Text style={styles.counterText}>
                {t("spotPhotos.photoOf", { index: index + 1, count })}
              </Text>
            </View>
          </>
        ) : null}

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
  step: {
    position: "absolute",
    top: "50%",
    width: 44,
    height: 44,
    marginTop: -22,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  stepLeft: {
    left: 12,
  },
  stepRight: {
    right: 12,
  },
  counter: {
    position: "absolute",
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
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
