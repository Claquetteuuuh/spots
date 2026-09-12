import type { Region } from "react-native-maps";

// Where the map was left, for as long as the app runs: coming back from a
// spot lands where the photographer was, not on their own position.
let remembered: Region | null = null;

export function rememberMapRegion(region: Region): void {
  remembered = region;
}

export function recallMapRegion(): Region | null {
  return remembered;
}

export function forgetMapRegion(): void {
  remembered = null;
}
