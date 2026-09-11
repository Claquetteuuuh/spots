/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Button } from "../ui/button";

describe("Button", () => {
  it("renders children", async () => {
    await act(async () => {
      render(<Button>Click me</Button>);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick handler", async () => {
    const onClick = vi.fn();
    await act(async () => {
      render(<Button onClick={onClick}>Click</Button>);
    });

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when loading", async () => {
    await act(async () => {
      render(<Button loading>Submit</Button>);
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is set", async () => {
    await act(async () => {
      render(<Button disabled>Submit</Button>);
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows spinner when loading", async () => {
    await act(async () => {
      render(<Button loading>Submit</Button>);
    });
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("applies variant classes", async () => {
    let rerender: (ui: React.ReactElement) => void;
    await act(async () => {
      const result = render(<Button variant="primary">Btn</Button>);
      rerender = result.rerender;
    });
    expect(screen.getByRole("button").className).toContain("bg-accent");

    await act(async () => {
      rerender!(<Button variant="danger">Btn</Button>);
    });
    expect(screen.getByRole("button").className).toContain("bg-error");
  });

  it("applies fullWidth class", async () => {
    await act(async () => {
      render(<Button fullWidth>Btn</Button>);
    });
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("applies size classes", async () => {
    let rerender: (ui: React.ReactElement) => void;
    await act(async () => {
      const result = render(<Button size="sm">Btn</Button>);
      rerender = result.rerender;
    });
    expect(screen.getByRole("button").className).toContain("px-3.5");

    // The app's two sizes: md is 12/24px, lg 16/24px — only the vertical
    // padding tells them apart.
    await act(async () => {
      rerender!(<Button size="md">Btn</Button>);
    });
    expect(screen.getByRole("button").className).toContain("py-3");

    await act(async () => {
      rerender!(<Button size="lg">Btn</Button>);
    });
    expect(screen.getByRole("button").className).toContain("py-4");
  });
});
