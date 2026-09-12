// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/lib/use-t", () => ({
  useT: () => (key: string) => key,
}));

import { DialogHost, confirmDialog, noticeDialog } from "../dialog";

// React 19 needs renders flushed through act before the tree can be queried
const mount = () =>
  act(async () => {
    render(<DialogHost />);
  });

describe("DialogHost", () => {
  it("asks the question and resolves true on confirm", async () => {
    await mount();
    expect(screen.queryByTestId("dialog")).toBeNull();

    let answer: Promise<boolean>;
    await act(async () => {
      answer = confirmDialog({ title: "Delete?", message: "Gone for good", confirmLabel: "Yes" });
    });

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("Delete?")).toBeTruthy();
    expect(screen.getByText("Gone for good")).toBeTruthy();
    expect(screen.getByTestId("dialog-confirm").textContent).toBe("Yes");
    expect(screen.getByTestId("dialog-cancel").textContent).toBe("common.cancel");

    await act(async () => {
      fireEvent.click(screen.getByTestId("dialog-confirm"));
    });
    await expect(answer!).resolves.toBe(true);
    await waitFor(() => expect(screen.queryByTestId("dialog")).toBeNull());
  });

  it("resolves false on cancel, Escape and a tap beside the card", async () => {
    await mount();

    let a: Promise<boolean>;
    await act(async () => {
      a = confirmDialog({ title: "A" });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("dialog-cancel"));
    });
    await expect(a!).resolves.toBe(false);

    let b: Promise<boolean>;
    await act(async () => {
      b = confirmDialog({ title: "B" });
    });
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await expect(b!).resolves.toBe(false);

    let c: Promise<boolean>;
    await act(async () => {
      c = confirmDialog({ title: "C" });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("dialog-backdrop"));
    });
    await expect(c!).resolves.toBe(false);
  });

  it("paints a destructive question red and starts on Cancel", async () => {
    await mount();
    await act(async () => {
      void confirmDialog({ title: "Delete", destructive: true });
    });
    expect(screen.getByTestId("dialog-confirm").className).toContain("bg-error");
    expect(document.activeElement).toBe(screen.getByTestId("dialog-cancel"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("dialog-cancel"));
    });
  });

  it("shows a notice with a single OK", async () => {
    await mount();
    let done: Promise<void>;
    await act(async () => {
      done = noticeDialog({ title: "Saved", message: "All good" });
    });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByTestId("dialog-cancel")).toBeNull();
    expect(screen.getByTestId("dialog-confirm").textContent).toBe("common.ok");
    await act(async () => {
      fireEvent.click(screen.getByTestId("dialog-confirm"));
    });
    await expect(done!).resolves.toBeUndefined();
  });

  it("shows dialogs one at a time, in order", async () => {
    await mount();
    let first: Promise<boolean>;
    let second: Promise<boolean>;
    await act(async () => {
      first = confirmDialog({ title: "First" });
      second = confirmDialog({ title: "Second" });
    });
    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.queryByText("Second")).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByTestId("dialog-confirm"));
    });
    await expect(first!).resolves.toBe(true);
    expect(screen.getByText("Second")).toBeTruthy();
    // The first card is still on its way out for a moment
    await waitFor(() => expect(screen.getAllByTestId("dialog")).toHaveLength(1));

    await act(async () => {
      fireEvent.click(screen.getByTestId("dialog-cancel"));
    });
    await expect(second!).resolves.toBe(false);
  });
});
