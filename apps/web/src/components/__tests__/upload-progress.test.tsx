// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import React from "react";

import { UploadProgress } from "../upload-progress";

/** The bar that rises inside the dot. */
const fill = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[role="progressbar"] > div');

/** Render and let React commit before reading the DOM. */
async function show(value: number) {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(<UploadProgress value={value} label="Sending" />);
  });
  const set = async (next: number) => {
    await act(async () => {
      view.rerender(<UploadProgress value={next} label="Sending" />);
    });
  };
  return { ...view, set };
}

describe("UploadProgress", () => {
  it("fills as the photos go up", async () => {
    const { container, set } = await show(0.42);

    expect(screen.getByText("42")).toBeTruthy();
    expect(fill(container)?.style.height).toBe("42%");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("42");

    await set(1);
    expect(fill(container)?.style.height).toBe("100%");
  });

  it("stays inside the dot whatever it is handed", async () => {
    const { container, set } = await show(-3);
    expect(fill(container)?.style.height).toBe("0%");

    await set(7);
    expect(fill(container)?.style.height).toBe("100%");
  });
});
