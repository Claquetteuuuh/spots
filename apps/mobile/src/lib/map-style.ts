import { Platform } from "react-native";
import type { MapViewProps } from "react-native-maps";
import { COLORS } from "@trs/shared/constants";

/**
 * How the native map is drawn, to match the web's basemap: colour where it
 * means something — parks and forests in green, relief where the land
 * rises. Android's Google terrain shows that shading directly; iOS has no
 * terrain type, so its standard map carries the parks and hillside tints.
 *
 * At night Apple's map turns dark on its own, from `userInterfaceStyle`.
 * Google's does not: it needs a style of its own, and only the standard
 * map takes one — so after dark the relief gives way to the app's palette,
 * which is the trade the web basemap makes too.
 */
const { dark } = COLORS;

/** The app's night palette, as Google Maps reads a style. */
const ANDROID_DARK = [
  { elementType: "geometry", stylers: [{ color: dark.bgSecondary }] },
  { elementType: "labels.text.fill", stylers: [{ color: dark.textSecondary }] },
  { elementType: "labels.text.stroke", stylers: [{ color: dark.bg }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: dark.borderDark }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: dark.bg }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: dark.textTertiary }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#14251C" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#5C7D68" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: dark.bgTertiary }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: dark.border }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: dark.textTertiary }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: dark.borderDark }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: dark.bgTertiary }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0A1A2E" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3E5C80" }] },
];

type NativeMapStyle = Pick<MapViewProps, "mapType" | "customMapStyle" | "userInterfaceStyle">;

/** The map's look for the theme in force. */
export function mapStyle(isDark: boolean): NativeMapStyle {
  if (Platform.OS !== "android") {
    return { mapType: "standard", userInterfaceStyle: isDark ? "dark" : "light" };
  }
  return isDark
    ? { mapType: "standard", customMapStyle: ANDROID_DARK, userInterfaceStyle: "dark" }
    : { mapType: "terrain", userInterfaceStyle: "light" };
}
