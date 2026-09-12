import React, { useEffect, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme";

const OPEN_MS = 320;
const CLOSE_MS = 240;
/** Let go past this share of the sheet's height and it closes… */
const CLOSE_FRACTION = 0.25;
/** …or flick it down faster than this, in px per second. */
const CLOSE_VELOCITY = 800;
const SNAP_BACK = { damping: 22, stiffness: 240 };

interface DrawerProps {
  visible: boolean;
  /** The sheet has slid away — a drag, the backdrop, the back button — so drop `visible`. */
  onClose: () => void;
  children: ReactNode;
  /** Extra styles on the sheet — a height cap, padding for the home bar. */
  sheetStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A bottom sheet in the style of shadcn's drawer: slides up from the
 * bottom edge, pulls down by its grip, and closes when let go far or fast
 * enough.
 */
export function Drawer({ visible, onClose, children, sheetStyle, testID }: DrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(screenHeight);
  const sheetHeight = useSharedValue(screenHeight);

  // Every opening starts below the screen and slides up
  useEffect(() => {
    if (!visible) return;
    translateY.value = screenHeight;
    translateY.value = withTiming(0, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) });
  }, [visible, screenHeight, translateY]);

  /** Slide out, then tell the owner. Runs on either thread. */
  const slideOut = () => {
    "worklet";
    translateY.value = withTiming(
      sheetHeight.value,
      { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  };

  const pull = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > sheetHeight.value * CLOSE_FRACTION || e.velocityY > CLOSE_VELOCITY) {
        slideOut();
      } else {
        translateY.value = withSpring(0, SNAP_BACK);
      }
    });

  const sheetMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  // The backdrop thins as the sheet is pulled down
  const backdropMotion = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, sheetHeight.value], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={slideOut} statusBarTranslucent>
      {/* A Modal is its own window: gestures need their own root inside it */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropMotion]}>
          <Pressable
            style={styles.fill}
            onPress={slideOut}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            testID="drawer-backdrop"
          />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { backgroundColor: theme.colors.bg }, sheetStyle, sheetMotion]}
          onLayout={(e) => {
            sheetHeight.value = e.nativeEvent.layout.height;
          }}
          testID={testID}
        >
          {/* The grip: pull here to bring the sheet down */}
          <GestureDetector gesture={pull}>
            <View style={styles.grip} testID="drawer-grip">
              <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(22, 32, 58, 0.35)",
  },
  fill: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexShrink: 1,
  },
  grip: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
