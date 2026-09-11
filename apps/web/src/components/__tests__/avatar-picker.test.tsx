/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { dicebearUrl } from "@trs/shared/constants";
import { AvatarPicker } from "../avatar-picker";

// `act` comes from `react` and wraps every event: Testing Library's
// synchronous `act` around `fireEvent` does not flush the updates React 19
// schedules here, so a state change made by a click would only show up
// after the assertion. Awaiting React's own async `act` flushes them.

vi.mock("@/lib/use-t", () => ({
  useT: () => (key: string) => key,
}));

// framer-motion renders no DOM under jsdom; the animation is not under test,
// so stand in plain elements for the two primitives the dialog uses.
vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: {
      div: React.forwardRef<HTMLDivElement, Record<string, unknown>>(function MotionDiv(
        { initial, animate, exit, transition, ...rest },
        ref,
      ) {
        void initial;
        void animate;
        void exit;
        void transition;
        return React.createElement("div", { ...rest, ref });
      }),
    },
  };
});

/** The large live preview is the first image in the dialog. */
function previewSrc(container: HTMLElement): string {
  return container.querySelector("img")?.getAttribute("src") ?? "";
}

type PickerProps = React.ComponentProps<typeof AvatarPicker>;

async function renderPicker(props: Partial<PickerProps> = {}) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <AvatarPicker open onClose={onClose} onSelect={onSelect} seed="alice" {...props} />,
    );
  });
  return { ...result, onClose, onSelect };
}

const click = (element: HTMLElement) =>
  act(async () => {
    fireEvent.click(element);
  });

describe("AvatarPicker", () => {
  it("renders nothing while closed", async () => {
    const { container } = await renderPicker({ open: false });
    expect(container.firstChild).toBeNull();
  });

  it("initialises style and background from the current avatar", async () => {
    const current = dicebearUrl("bottts", "alice", "ffd5dc");
    const { container } = await renderPicker({ currentUrl: current });

    expect(previewSrc(container)).toBe(current);
    expect(screen.getByRole("button", { name: /bottts/ }).className).toContain("ring-accent");
  });

  it("falls back to the first style and colour without a current avatar", async () => {
    const { container } = await renderPicker();
    expect(previewSrc(container)).toBe(dicebearUrl("avataaars", "alice", "b6e3f4"));
  });

  it("updates the preview when a style or a colour is picked", async () => {
    const { container } = await renderPicker();

    await click(screen.getByRole("button", { name: /lorelei/ }));
    expect(previewSrc(container)).toContain("/lorelei/");

    await click(screen.getByRole("button", { name: "#c0aede" }));
    expect(previewSrc(container)).toContain("backgroundColor=c0aede");
  });

  it("Random re-seeds but keeps the chosen style and colour", async () => {
    const current = dicebearUrl("bottts", "alice", "ffd5dc");
    const { container } = await renderPicker({ currentUrl: current });

    await click(screen.getByRole("button", { name: "avatar.random" }));

    const next = previewSrc(container);
    expect(next).not.toBe(current);
    expect(next).toContain("/bottts/");
    expect(next).toContain("backgroundColor=ffd5dc");
  });

  it("Save hands back the previewed URL and closes", async () => {
    const { container, onSelect, onClose } = await renderPicker();

    await click(screen.getByRole("button", { name: "common.save" }));

    expect(onSelect).toHaveBeenCalledWith(previewSrc(container));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Remove hands back null and closes", async () => {
    const { onSelect, onClose } = await renderPicker({
      currentUrl: dicebearUrl("bottts", "alice", "ffd5dc"),
    });

    await click(screen.getByRole("button", { name: "avatar.removeAvatar" }));

    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("offers Remove only when there is an avatar to remove", async () => {
    await renderPicker();
    expect(screen.queryByRole("button", { name: "avatar.removeAvatar" })).toBeNull();
  });

  it("closes on Escape", async () => {
    const { onClose } = await renderPicker();

    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Regression: the dialog used to keep its state across open/close and
  // patch it back in an effect. It now mounts fresh, so a different avatar
  // on the next open must show up immediately.
  it("re-initialises from the current avatar every time it opens", async () => {
    const first = dicebearUrl("bottts", "alice", "ffd5dc");
    const second = dicebearUrl("lorelei", "alice", "c0aede");
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const picker = (open: boolean, currentUrl: string) => (
      <AvatarPicker
        open={open}
        onClose={onClose}
        onSelect={onSelect}
        seed="alice"
        currentUrl={currentUrl}
      />
    );

    let result!: ReturnType<typeof render>;
    await act(async () => {
      result = render(picker(true, first));
    });
    expect(previewSrc(result.container)).toBe(first);

    await act(async () => {
      result.rerender(picker(false, first));
    });
    await act(async () => {
      result.rerender(picker(true, second));
    });

    expect(previewSrc(result.container)).toBe(second);
  });
});
