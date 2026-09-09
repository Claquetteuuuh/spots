import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";

/**
 * The spots wordmark: "spots" set in Fredoka with the o replaced by a filled
 * circle — a spot on a map, dropped into the name.
 *
 * The circle is deliberately larger than the letter it stands in for, so it
 * reads as a marker rather than a typographic quirk. Both halves take the same
 * colour, so the mark works in brand blue on white or in white on a photograph.
 */
export function Wordmark({
  size = 28,
  color,
}: {
  /** Cap size in points; the dot scales with it. */
  size?: number;
  /** Defaults to the brand blue. */
  color?: string;
}) {
  const theme = useTheme();
  const tint = color ?? theme.colors.accent;
  const dot = size * 0.66;

  const letters = {
    fontFamily: theme.typography.display,
    fontSize: size,
    lineHeight: size * 1.2,
    color: tint,
  };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="spots"
      style={{ flexDirection: "row", alignItems: "center" }}
    >
      <Text style={letters}>sp</Text>
      <View
        style={{
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: tint,
          marginHorizontal: size * 0.045,
        }}
      />
      <Text style={letters}>ts</Text>
    </View>
  );
}
