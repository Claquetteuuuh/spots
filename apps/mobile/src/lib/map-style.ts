import { Platform } from "react-native";
import type { MapViewProps } from "react-native-maps";

/**
 * How the native map is drawn, to match the web's topographic basemap:
 * colour where it means something — parks and forests in green, relief
 * where the land rises. Android's Google terrain shows that shading
 * directly; iOS has no terrain type, so its standard map carries the
 * parks and the hillside tints instead.
 */
export const MAP_STYLE: Pick<MapViewProps, "mapType"> = {
  mapType: Platform.OS === "android" ? "terrain" : "standard",
};
