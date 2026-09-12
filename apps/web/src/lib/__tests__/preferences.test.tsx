/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { isLivePositionEnabled, setLivePositionEnabled, useLivePositionPref } from "../preferences";

function Probe() {
  const [enabled, setEnabled] = useLivePositionPref();
  return (
    <button type="button" onClick={() => setEnabled(!enabled)}>
      {enabled ? "on" : "off"}
    </button>
  );
}

describe("live position preference", () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
  });

  it("is on by default, persists a change and follows it in every subscriber", async () => {
    expect(isLivePositionEnabled()).toBe(true);

    await act(async () => {
      render(
        <>
          <Probe />
          <Probe />
        </>,
      );
    });
    expect(screen.getAllByText("on")).toHaveLength(2);

    await act(async () => {
      screen.getAllByRole("button")[0].click();
    });
    expect(screen.getAllByText("off")).toHaveLength(2);
    expect(isLivePositionEnabled()).toBe(false);

    await act(async () => setLivePositionEnabled(true));
    expect(screen.getAllByText("on")).toHaveLength(2);
  });
});
