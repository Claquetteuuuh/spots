import { Platform } from "react-native";
import type { MapViewProps } from "react-native-maps";

/**
 * How the native map is drawn: Apple's muted style on iOS keeps roads and
 * labels quiet so the coloured pins read first; Android has no such
 * option, so it stays standard.
 */
export const MAP_STYLE: Pick<MapViewProps, "mapType"> = {
  mapType: Platform.OS === "ios" ? "mutedStandard" : "standard",
};
