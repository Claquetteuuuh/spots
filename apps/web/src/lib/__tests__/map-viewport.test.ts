// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { forgetMapView, recallMapView, rememberMapView } from "../map-viewport";

describe("map viewport memory", () => {
  beforeEach(() => {
    forgetMapView();
  });

  it("starts empty, then gives back what was remembered", () => {
    expect(recallMapView()).toBeNull();
    rememberMapView({ lat: 48.85, lng: 2.35, zoom: 13 });
    expect(recallMapView()).toEqual({ lat: 48.85, lng: 2.35, zoom: 13 });
    expect(sessionStorage.getItem("trs.map.view")).toContain("48.85");
  });

  it("forgets on demand", () => {
    rememberMapView({ lat: 1, lng: 2, zoom: 3 });
    forgetMapView();
    expect(recallMapView()).toBeNull();
    expect(sessionStorage.getItem("trs.map.view")).toBeNull();
  });

  it("ignores garbage left in storage", () => {
    sessionStorage.setItem("trs.map.view", "{not json");
    expect(recallMapView()).toBeNull();
    sessionStorage.setItem("trs.map.view", JSON.stringify({ lat: "x" }));
    expect(recallMapView()).toBeNull();
  });
});
