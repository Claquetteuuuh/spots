// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { ZoomablePhoto } from "../zoomable-photo";

function scaleOf(): number {
  const match = /scale\(([\d.]+)\)/.exec(screen.getByTestId("zoomable-photo-image").style.transform);
  return match ? Number(match[1]) : NaN;
}

const mount = () =>
  act(async () => {
    render(<ZoomablePhoto src="https://cdn/a.webp" alt="Seine" />);
  });

describe("ZoomablePhoto", () => {
  it("shows the photo at 1×, leaving one finger to the page", async () => {
    await mount();
    expect(scaleOf()).toBe(1);
    expect(screen.getByTestId("zoomable-photo").className).toContain("touch-pan-y");

    const frame = screen.getByTestId("zoomable-photo");
    await act(async () => {
      fireEvent.pointerDown(frame, { pointerId: 1, clientX: 50, clientY: 50 });
      fireEvent.pointerMove(frame, { pointerId: 1, clientX: 50, clientY: 120 });
      fireEvent.pointerUp(frame, { pointerId: 1, clientX: 50, clientY: 120 });
    });
    expect(scaleOf()).toBe(1);
  });

  it("grows under two spreading fingers and settles back when one lifts", async () => {
    await mount();
    const frame = screen.getByTestId("zoomable-photo");

    await act(async () => {
      fireEvent.pointerDown(frame, { pointerId: 1, clientX: 40, clientY: 50 });
      fireEvent.pointerDown(frame, { pointerId: 2, clientX: 60, clientY: 50 });
      fireEvent.pointerMove(frame, { pointerId: 2, clientX: 100, clientY: 50 });
    });
    expect(scaleOf()).toBeCloseTo(3); // 20px apart → 60px apart
    expect(screen.getByTestId("zoomable-photo-image").style.transition).toBe("none");

    await act(async () => {
      fireEvent.pointerUp(frame, { pointerId: 2, clientX: 100, clientY: 50 });
    });
    expect(scaleOf()).toBe(1);
    expect(screen.getByTestId("zoomable-photo-image").style.transition).not.toBe("none");
  });

  it("zooms on a trackpad pinch (ctrl + wheel) and settles once it stops", async () => {
    await mount();
    const frame = screen.getByTestId("zoomable-photo");

    await act(async () => {
      fireEvent.wheel(frame, { deltaY: 100, clientX: 0, clientY: 0 });
    });
    expect(scaleOf()).toBe(1); // a plain scroll is the page's

    await act(async () => {
      fireEvent.wheel(frame, { deltaY: -300, ctrlKey: true, clientX: 0, clientY: 0 });
    });
    expect(scaleOf()).toBeGreaterThan(1);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(scaleOf()).toBe(1);
  });
});
