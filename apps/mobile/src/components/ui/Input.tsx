import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Clean boxed text field with subtle background fill and rounded corners.
 * Instagram-style: light fill, thin border on focus, compact and quiet.
 */
export function Input({ label, error, containerStyle, onFocus, onBlur, ...rest }: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : isFocused
      ? theme.colors.borderDark
      : theme.colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: error ? theme.colors.error : theme.colors.textSecondary,
              fontSize: theme.typography.size.xs,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          styles.input,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.bgSecondary,
            borderColor,
            borderWidth: theme.borderWidth.hairline,
            borderRadius: theme.radius.md,
            fontSize: theme.typography.size.base,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      />
      {error ? (
        <Text
          style={[
            styles.error,
            { color: theme.colors.error, fontSize: theme.typography.size.xs, marginTop: theme.spacing.xs },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
  },
  error: {
    fontWeight: "400",
  },
});
