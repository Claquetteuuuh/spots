import React from "react";
import { Keyboard, Pressable, StyleSheet } from "react-native";

interface DismissKeyboardProps {
  children: React.ReactNode;
}

/**
 * Wrap a screen's content so tapping outside any input dismisses the keyboard.
 * Uses Pressable instead of TouchableWithoutFeedback so nested
 * Pressable / Button / TextInput still receive their own touches.
 */
export function DismissKeyboard({ children }: DismissKeyboardProps) {
  return (
    <Pressable style={styles.container} onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
