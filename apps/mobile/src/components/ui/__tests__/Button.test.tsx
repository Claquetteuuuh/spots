import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Button } from "../Button";

// Mock the theme hook
jest.mock("../../../theme", () => ({
  useTheme: () => ({
    dark: false,
    colors: {
      accent: "#8B7355",
      onAccent: "#FAFAF8",
      text: "#1A1A18",
      textSecondary: "#6B6960",
      border: "#E8E6E1",
    },
    spacing: { sm: 8, md: 12, lg: 16, xl: 24 },
    typography: {
      size: { base: 15, md: 16 },
      weight: { semibold: "600" },
    },
    radius: { md: 4 },
    borderWidth: { hairline: 1 },
  }),
}));

describe("Button", () => {
  const onPress = jest.fn();

  beforeEach(() => {
    onPress.mockClear();
  });

  it("renders the title text", async () => {
    await render(<Button title="Submit" onPress={onPress} />);
    expect(screen.getByText("Submit")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    await render(<Button title="Submit" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId("btn"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", async () => {
    await render(
      <Button title="Submit" onPress={onPress} disabled testID="btn" />
    );
    fireEvent.press(screen.getByTestId("btn"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not call onPress when loading", async () => {
    await render(
      <Button title="Submit" onPress={onPress} loading testID="btn" />
    );
    fireEvent.press(screen.getByTestId("btn"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("hides title text when loading", async () => {
    await render(
      <Button title="Submit" onPress={onPress} loading />
    );
    expect(screen.queryByText("Submit")).toBeNull();
  });

  it("renders with accessibility role button", async () => {
    await render(
      <Button title="Submit" onPress={onPress} testID="btn" />
    );
    expect(screen.getByTestId("btn").props.accessibilityRole).toBe("button");
  });
});
