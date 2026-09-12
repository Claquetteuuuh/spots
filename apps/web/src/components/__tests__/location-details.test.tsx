// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/lib/use-t", () => ({
  useT: () => (key: string) => key,
}));

import { LocationDetails } from "../location-details";

const writeText = vi.fn();

describe("LocationDetails", () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  const mount = (address: string | null = "12 quai de Seine, Paris") =>
    act(async () => {
      render(<LocationDetails latitude={48.856614} longitude={2.3522219} address={address} />);
    });

  it("shows the address over small coordinates, and directions for three apps", async () => {
    await mount();
    expect(screen.getByTestId("copy-address").textContent).toBe("12 quai de Seine, Paris");
    const coords = screen.getByTestId("copy-coordinates");
    expect(coords.textContent).toBe("48.85661, 2.35222");
    expect(coords.className).toContain("text-[11px]");

    expect(screen.getByTestId("open-google").getAttribute("href")).toContain("google.com/maps/dir/?api=1&destination=48.856614,2.3522219");
    expect(screen.getByTestId("open-apple").getAttribute("href")).toContain("maps.apple.com/?daddr=48.856614,2.3522219");
    expect(screen.getByTestId("open-waze").getAttribute("href")).toContain("waze.com/ul?ll=48.856614,2.3522219");
    expect(screen.getByTestId("open-waze").getAttribute("target")).toBe("_blank");
  });

  it("copies the address on a tap and says so for a moment", async () => {
    await mount();
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-address"));
    });
    expect(writeText).toHaveBeenCalledWith("12 quai de Seine, Paris");
    expect(screen.getByTestId("copy-address").textContent).toBe("common.copied");
    await waitFor(() => expect(screen.getByTestId("copy-address").textContent).toBe("12 quai de Seine, Paris"), {
      timeout: 2500,
    });
  });

  it("copies the coordinates too, and copes without an address", async () => {
    await mount(null);
    expect(screen.queryByTestId("copy-address")).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-coordinates"));
    });
    expect(writeText).toHaveBeenCalledWith("48.85661, 2.35222");
    expect(screen.getByTestId("copy-coordinates").textContent).toBe("common.copied");
  });
});
