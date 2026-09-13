import { Platform } from "react-native";
import { mapStyle } from "../map-style";

const platform = Platform as unknown as { OS: string };
const original = platform.OS;

describe("mapStyle", () => {
  afterEach(() => {
    platform.OS = original;
  });

  it("gives Apple's map the theme and lets it dress itself", () => {
    platform.OS = "ios";

    expect(mapStyle(false)).toEqual({ mapType: "standard", userInterfaceStyle: "light" });
    expect(mapStyle(true)).toEqual({ mapType: "standard", userInterfaceStyle: "dark" });
  });

  it("shows relief on Google's map by day and the app's own palette at night", () => {
    platform.OS = "android";

    expect(mapStyle(false)).toMatchObject({ mapType: "terrain" });
    // Google's map ignores a custom style on any but the standard type —
    // without this it stayed daylight-bright while the app went dark.
    const night = mapStyle(true);
    expect(night.mapType).toBe("standard");
    expect(night.customMapStyle?.length).toBeGreaterThan(0);
    expect(JSON.stringify(night.customMapStyle)).toContain("#0D1420");
  });
});
