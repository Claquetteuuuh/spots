import React from "react";
import {
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { dicebearRasterUrl } from "@trs/shared/constants";
import { useTheme } from "../theme";

/** Two-letter initials — "Ada Lovelace" → "AL", unknown → "?". */
export function initialsOf(name: string | null | undefined): string {
  const letters = (name ?? "")
    .split(" ")
    .map((part: string) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return letters || "?";
}

interface AvatarProps {
  /** Avatar URL (DiceBear, R2, or any image). */
  url: string | null | undefined;
  /** Full name — used for initials fallback. */
  name: string | null | undefined;
  /** Pixel diameter (default 44). */
  size?: number;
  /** Override the container style (border, background, etc.). */
  style?: ViewStyle;
  /** Override the initials text style. */
  textStyle?: TextStyle;
}

/**
 * Reusable avatar circle for React Native.
 * Shows the URL image when available, otherwise renders initials.
 */
export function Avatar({ url, name, size = 44, style, textStyle }: AvatarProps) {
  const theme = useTheme();

  const baseSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (url) {
    // DiceBear avatars are stored as SVG, which <Image> cannot draw — ask
    // for a PNG at the device's real pixel size instead.
    const uri = dicebearRasterUrl(url, PixelRatio.getPixelSizeForLayoutSize(size));
    return <Image source={{ uri }} style={[baseSize, style as ImageStyle]} />;
  }

  return (
    <View
      style={[
        styles.placeholder,
        { backgroundColor: theme.colors.bgTertiary },
        baseSize,
        style,
      ]}
    >
      <Text
        style={[
          {
            color: theme.colors.textSecondary,
            fontSize: Math.max(10, size * 0.32),
            fontWeight: "600",
          },
          textStyle,
        ]}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
});
