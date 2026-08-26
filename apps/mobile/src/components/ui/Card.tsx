import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

/**
 * Flat card with a single hairline border. No shadow, no elevation —
 * separation from the background comes from the border and a slightly
 * different fill, never from a blurred drop shadow.
 */
export function Card({ children, style, padded = true }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderWidth: theme.borderWidth.hairline,
          borderRadius: theme.radius.md,
          padding: padded ? theme.spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
