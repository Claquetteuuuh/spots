import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The single button primitive for the app. No gradients, no shadows —
 * variants are expressed purely through fill and border.
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "primary"
      ? theme.colors.accent
      : variant === "secondary"
        ? theme.colors.bgSecondary
        : "transparent";

  const borderColor =
    variant === "secondary"
      ? theme.colors.border
      : variant === "primary"
        ? theme.colors.accent
        : "transparent";

  const textColor =
    variant === "primary"
      ? theme.colors.onAccent
      : variant === "secondary"
        ? theme.colors.text
        : theme.colors.accent;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === "ghost" ? 0 : theme.borderWidth.hairline,
          borderRadius: theme.radius.full,
          paddingVertical: size === "lg" ? theme.spacing.lg : theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize: size === "lg" ? theme.typography.size.md : theme.typography.size.base,
              fontWeight: theme.typography.weight.semibold,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
