/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick handler", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when loading", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows spinner when loading", () => {
    render(<Button loading>Submit</Button>);
    // The spinner is an SVG with animate-spin class
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("applies variant classes", () => {
    const { rerender } = render(<Button variant="primary">Btn</Button>);
    expect(screen.getByRole("button").className).toContain("bg-accent");

    rerender(<Button variant="danger">Btn</Button>);
    expect(screen.getByRole("button").className).toContain("bg-error");
  });

  it("applies fullWidth class", () => {
    render(<Button fullWidth>Btn</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("applies size classes", () => {
    const { rerender } = render(<Button size="sm">Btn</Button>);
    expect(screen.getByRole("button").className).toContain("px-3");

    rerender(<Button size="lg">Btn</Button>);
    expect(screen.getByRole("button").className).toContain("px-6");
  });
});
