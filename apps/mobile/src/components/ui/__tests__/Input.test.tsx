import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Input } from "../Input";

jest.mock("../../../theme", () => ({
  useTheme: () => ({
    dark: false,
    colors: {
      bg: "#FAFAF8",
      bgSecondary: "#F0EDE8",
      bgTertiary: "#E8E6E1",
      text: "#1A1A18",
      textSecondary: "#6B6960",
      textTertiary: "#A8A49C",
      border: "#E8E6E1",
      borderDark: "#D0CEC9",
      error: "#C44536",
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16 },
    typography: {
      size: { xs: 12, base: 15 },
    },
    radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 20, full: 9999 },
    borderWidth: { hairline: 1, thick: 2 },
  }),
}));

describe("Input", () => {
  it("renders the label", async () => {
    await render(<Input label="Email" testID="input" />);
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("does not render label when not provided", async () => {
    await render(<Input testID="input" />);
    expect(screen.queryByText("Email")).toBeNull();
  });

  it("shows error message", async () => {
    await render(<Input label="Email" error="Required" testID="input" />);
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("does not show error when not provided", async () => {
    await render(<Input label="Email" testID="input" />);
    expect(screen.queryByText("Required")).toBeNull();
  });

  it("calls onChangeText", async () => {
    const onChangeText = jest.fn();
    await render(<Input testID="input" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByTestId("input"), "hello");
    expect(onChangeText).toHaveBeenCalledWith("hello");
  });

  it("calls onFocus and onBlur callbacks", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(
      <Input testID="input" onFocus={onFocus} onBlur={onBlur} />
    );
    const input = screen.getByTestId("input");
    fireEvent(input, "focus");
    expect(onFocus).toHaveBeenCalled();
    fireEvent(input, "blur");
    expect(onBlur).toHaveBeenCalled();
  });
});
