import { forgetMapRegion, recallMapRegion, rememberMapRegion } from "../map-memory";

const REGION = { latitude: 48.85, longitude: 2.35, latitudeDelta: 0.05, longitudeDelta: 0.05 };

describe("map region memory", () => {
  beforeEach(() => {
    forgetMapRegion();
  });

  it("starts empty, then gives back what was remembered", () => {
    expect(recallMapRegion()).toBeNull();
    rememberMapRegion(REGION);
    expect(recallMapRegion()).toEqual(REGION);
  });

  it("forgets on demand", () => {
    rememberMapRegion(REGION);
    forgetMapRegion();
    expect(recallMapRegion()).toBeNull();
  });
});
