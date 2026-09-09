import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { CompositionType } from "@trs/shared/constants";
import { useTheme } from "../../theme";

export interface CompositionBadgeProps {
  type: CompositionType;
  size?: "sm" | "md";
}

/**
 * Small tag showing a composition type. A pill, like every other chip in the
 * app — the roundness comes from the wordmark.
 */
export function CompositionBadge({ type, size = "md" }: CompositionBadgeProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const label = t(`compositions.${type}`);

  return (
    <View
      style={[
        styles.base,
        {
          borderColor: theme.colors.borderDark,
          borderWidth: theme.borderWidth.hairline,
          borderRadius: theme.radius.full,
          paddingVertical: size === "sm" ? 2 : theme.spacing.xs,
          paddingHorizontal: size === "sm" ? theme.spacing.xs : theme.spacing.sm,
          backgroundColor: theme.colors.bgSecondary,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={{
          color: theme.colors.textSecondary,
          fontSize: size === "sm" ? theme.typography.size.xs - 1 : theme.typography.size.xs,
          fontWeight: theme.typography.weight.medium,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
  },
});
