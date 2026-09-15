// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { DRAWER_DURATION_MS, Drawer } from "../drawer";

const SHEET_HEIGHT = 400;

/** Until the sheet has left the bottom edge (two frames, longer under load). */
const frames = () =>
  waitFor(() => expect(screen.getByTestId("drawer").getAttribute("data-state")).toBe("open"), {
    timeout: 5000,
  });

/** Outlast the slide. */
const slide = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, DRAWER_DURATION_MS + 20));
  });

const sheet = () => screen.getByTestId("drawer");
const transformOf = () => sheet().style.transform;

async function drag(from: number, to: number, steps = 4) {
  const grip = screen.getByTestId("drawer-grip");
  await act(async () => {
    fireEvent.pointerDown(grip, { pointerId: 1, clientY: from });
    for (let i = 1; i <= steps; i++) {
      fireEvent.pointerMove(grip, { pointerId: 1, clientY: from + ((to - from) * i) / steps });
    }
    fireEvent.pointerUp(grip, { pointerId: 1, clientY: to });
  });
}

describe("Drawer", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom has no layout: give the sheet a height for the close threshold
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get: () => SHEET_HEIGHT,
    });
  });

  afterEach(() => {
    // @ts-expect-error — restore jsdom's own (absent) layout
    delete HTMLElement.prototype.offsetHeight;
  });

  const mount = (open = true) =>
    act(async () => {
      render(
        <Drawer open={open} onClose={onClose} label="Filters">
          <p>Body</p>
        </Drawer>,
      );
    });

  it("stays out of the tree while closed", async () => {
    await mount(false);
    expect(screen.queryByTestId("drawer")).toBeNull();
  });

  it("slides up from the bottom edge when opened", async () => {
    await mount();
    // First paint: parked below the screen, ready to slide
    expect(sheet().getAttribute("data-state")).toBe("entering");
    expect(transformOf()).toBe("translateY(100%)");
    expect(screen.getByText("Body")).toBeTruthy();

    await frames();
    expect(sheet().getAttribute("data-state")).toBe("open");
    expect(transformOf()).toBe("translateY(0px)");
    expect(sheet().style.transition).toContain(`${DRAWER_DURATION_MS}ms`);
  });

  it("follows the finger on its grip and snaps back after a short pull", async () => {
    await mount();
    await frames();

    const grip = screen.getByTestId("drawer-grip");
    // An unhurried pull: 60px over 200ms
    const now = vi.spyOn(performance, "now");
    now.mockReturnValueOnce(0).mockReturnValueOnce(200);
    await act(async () => {
      fireEvent.pointerDown(grip, { pointerId: 1, clientY: 100 });
      fireEvent.pointerMove(grip, { pointerId: 1, clientY: 160 });
    });
    now.mockRestore();
    expect(transformOf()).toBe("translateY(60px)");
    expect(sheet().style.transition).toBe("none");
    // The backdrop thins as the sheet goes down
    expect(Number(screen.getByTestId("drawer-backdrop").style.opacity)).toBeCloseTo(1 - 60 / SHEET_HEIGHT);

    await act(async () => {
      fireEvent.pointerUp(grip, { pointerId: 1, clientY: 160 });
    });
    expect(transformOf()).toBe("translateY(0px)");
    await slide();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes once pulled past a quarter of its height", async () => {
    await mount();
    await frames();

    await drag(100, 100 + SHEET_HEIGHT * 0.4);
    expect(sheet().getAttribute("data-state")).toBe("leaving");
    expect(transformOf()).toBe("translateY(100%)");
    expect(onClose).not.toHaveBeenCalled();

    await slide();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("drawer")).toBeNull();
  });

  it("closes on a quick flick, even a short one", async () => {
    await mount();
    await frames();

    const grip = screen.getByTestId("drawer-grip");
    const now = vi.spyOn(performance, "now");
    now.mockReturnValueOnce(0).mockReturnValueOnce(10);
    await act(async () => {
      fireEvent.pointerDown(grip, { pointerId: 1, clientY: 100 });
      fireEvent.pointerMove(grip, { pointerId: 1, clientY: 130 }); // 30px in 10ms
      fireEvent.pointerUp(grip, { pointerId: 1, clientY: 130 });
    });
    now.mockRestore();

    await slide();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("closes from the backdrop and from Escape, after sliding out", async () => {
    await mount();
    await frames();

    await act(async () => {
      fireEvent.click(screen.getByTestId("drawer-backdrop"));
    });
    expect(sheet().getAttribute("data-state")).toBe("leaving");
    await slide();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    await mount();
    await frames();
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await slide();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(2));
  });

  it("slides out when its owner drops `open`", async () => {
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(
        <Drawer open onClose={onClose} label="Filters">
          <p>Body</p>
        </Drawer>,
      );
    });
    await frames();

    await act(async () => {
      view.rerender(
        <Drawer open={false} onClose={onClose} label="Filters">
          <p>Body</p>
        </Drawer>,
      );
    });
    expect(sheet().getAttribute("data-state")).toBe("leaving");
    await slide();
    expect(screen.queryByTestId("drawer")).toBeNull();
    // The owner already knows: no second notice
    expect(onClose).not.toHaveBeenCalled();
  });
});
