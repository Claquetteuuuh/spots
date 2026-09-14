import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme";

interface UploadProgressProps {
  /** How much of the upload has gone out, 0 → 1. */
  value: number;
  label: string;
  size?: number;
  testID?: string;
}

/**
 * A dot that fills as the photos go up — the app's recurring circle, used
 * here for a quantity rather than a place. Shown with the share of the
 * body already sent, which is what a photographer is waiting on.
 */
export function UploadProgress({ value, label, size = 36, testID }: UploadProgressProps) {
  const theme = useTheme();
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ now: percent, min: 0, max: 100 }}>
      <View
        style={[
          styles.dial,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.colors.accent,
            backgroundColor: theme.colors.accentTint,
          },
        ]}
        testID={testID}
      >
        {/* The fill rises from the bottom, like a glass */}
        <View
          style={[
            styles.fill,
            { height: `${percent}%`, backgroundColor: theme.colors.accent },
          ]}
        />
        <Text
          style={[styles.percent, { color: theme.colors.text }]}
          testID={testID ? `${testID}-percent` : undefined}
        >
          {percent}
        </Text>
      </View>
      <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.size.sm }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dial: {
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  percent: {
    fontSize: 10,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
