/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "../ui/input";

describe("Input", () => {
  it("renders with a label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });

  it("renders without a label", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeTruthy();
  });

  it("shows error message", () => {
    render(<Input label="Name" error="Required field" />);
    expect(screen.getByText("Required field")).toBeTruthy();
  });

  it("shows hint when no error", () => {
    render(<Input label="Password" hint="At least 8 characters" />);
    expect(screen.getByText("At least 8 characters")).toBeTruthy();
  });

  it("hides hint when error is present", () => {
    render(<Input label="Password" hint="Hint text" error="Error text" />);
    expect(screen.getByText("Error text")).toBeTruthy();
    expect(screen.queryByText("Hint text")).toBeNull();
  });

  it("applies error border style", () => {
    render(<Input label="Email" error="Invalid" />);
    const input = screen.getByLabelText("Email");
    expect(input.className).toContain("border-error");
  });

  it("calls onChange handler", () => {
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "test" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("generates id from label", () => {
    render(<Input label="Full name" />);
    const input = screen.getByLabelText("Full name");
    expect(input.id).toBe("full-name");
  });

  it("uses provided id over generated one", () => {
    render(<Input label="Email" id="custom-id" />);
    const input = screen.getByLabelText("Email");
    expect(input.id).toBe("custom-id");
  });
});
