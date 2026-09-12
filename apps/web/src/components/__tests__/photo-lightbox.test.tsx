// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@/lib/use-t", () => ({
  useT: () => (key: string) => key,
}));

import { PhotoLightbox } from "../photo-lightbox";

const URLS = ["https://cdn/a.webp", "https://cdn/b.webp"];

function scaleOf(el: HTMLElement): number {
  const match = /scale\(([\d.]+)\)/.exec(el.style.transform);
  return match ? Number(match[1]) : NaN;
}

describe("PhotoLightbox", () => {
  const onClose = vi.fn();
  const onIndexChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // React 19 needs renders flushed through act before the tree can be queried
  const renderBox = async (index = 0) => {
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(
        <PhotoLightbox urls={URLS} index={index} alt="Seine" onIndexChange={onIndexChange} onClose={onClose} />,
      );
    });
    // Passive effects (key listener, scroll lock) land on the next flush
    await act(async () => {});
    return view;
  };

  it("shows the photo at 1× and closes on Escape or the cross", async () => {
    await renderBox();
    const img = screen.getByTestId("lightbox-image") as HTMLImageElement;
    expect(img.src).toBe(URLS[0]);
    expect(scaleOf(img)).toBe(1);
    expect(screen.getByText("1/2")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("lightbox-close"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("locks the page scroll while open and frees it after", async () => {
    const { unmount } = await renderBox();
    expect(document.body.style.overflow).toBe("hidden");
    await act(async () => {
      unmount();
    });
    expect(document.body.style.overflow).toBe("");
  });

  it("steps through the photos with the arrows and the keyboard", async () => {
    await renderBox(0);
    fireEvent.click(screen.getByTestId("lightbox-next"));
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByTestId("lightbox-prev"));
    expect(onIndexChange).toHaveBeenLastCalledWith(1); // wraps round from the first
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });

  it("zooms with the wheel and toggles with a double-click", async () => {
    await renderBox();
    const img = screen.getByTestId("lightbox-image");

    await act(async () => {
      fireEvent.wheel(img, { deltaY: -300, clientX: 0, clientY: 0 });
    });
    expect(scaleOf(img)).toBeGreaterThan(1);

    await act(async () => {
      fireEvent.doubleClick(img, { clientX: 0, clientY: 0 });
    });
    expect(scaleOf(img)).toBe(1);
    await act(async () => {
      fireEvent.doubleClick(img, { clientX: 0, clientY: 0 });
    });
    expect(scaleOf(img)).toBe(2.5);
  });

  it("drags a zoomed photo around, and a drag never closes it", async () => {
    await renderBox();
    const img = screen.getByTestId("lightbox-image");
    const frame = screen.getByTestId("lightbox-frame");
    await act(async () => {
      fireEvent.doubleClick(img, { clientX: 0, clientY: 0 });
    });

    await act(async () => {
      fireEvent.pointerDown(frame, { pointerId: 1, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(frame, { pointerId: 1, clientX: 40, clientY: 25 });
      fireEvent.pointerUp(frame, { pointerId: 1 });
      fireEvent.click(frame);
    });
    expect(img.style.transform).toContain("translate(30px, 15px)");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on a tap beside the photo, not on the photo", async () => {
    await renderBox();
    const img = screen.getByTestId("lightbox-image");
    const frame = screen.getByTestId("lightbox-frame");

    fireEvent.pointerDown(img, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(img, { pointerId: 1 });
    fireEvent.click(img);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(frame, { pointerId: 2, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(frame, { pointerId: 2 });
    fireEvent.click(frame);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
