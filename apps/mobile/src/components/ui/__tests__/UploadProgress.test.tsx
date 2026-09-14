import React from "react";
import { render, screen } from "@testing-library/react-native";
import { UploadProgress } from "../UploadProgress";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

describe("UploadProgress", () => {
  it("fills as the photos go up", async () => {
    await render(<UploadProgress value={0.42} label="Sending" testID="dial" />);

    expect(screen.getByTestId("dial-percent").props.children).toBe(42);
  });

  it("stays inside the dot whatever it is handed", async () => {
    const view = await render(<UploadProgress value={-3} label="Sending" testID="dial" />);
    expect(screen.getByTestId("dial-percent").props.children).toBe(0);

    await view.rerender(<UploadProgress value={7} label="Sending" testID="dial" />);
    expect(screen.getByTestId("dial-percent").props.children).toBe(100);
  });
});
