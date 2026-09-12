/**
 * @vitest-environment jsdom
 */
import { act, useEffect } from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCamera, useCameraPermission } from "../use-camera";

type Value = ReturnType<typeof useCamera>;
const latest: { current: Value | null } = { current: null };
function Probe() {
  const camera = useCamera();
  useEffect(() => {
    latest.current = camera;
  });
  return <video ref={(el) => camera.attachVideo(el)} data-testid="video" />;
}

function stubMedia(getUserMedia: (c: MediaStreamConstraints) => Promise<MediaStream>, inputs = 2) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia,
      enumerateDevices: () =>
        Promise.resolve(Array.from({ length: inputs }, () => ({ kind: "videoinput" }))),
    },
  });
}

const fakeStream = () => {
  const stop = vi.fn();
  return { stream: { getTracks: () => [{ stop }] } as unknown as MediaStream, stop };
};

const denied = () => Object.assign(new Error("denied"), { name: "NotAllowedError" });

afterEach(() => {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
});

describe("useCamera", () => {
  it("attaches the stream to the mounted video, flips, and stops every track", async () => {
    const { stream, stop } = fakeStream();
    const getUserMedia = vi.fn((_c: MediaStreamConstraints) => Promise.resolve(stream));
    stubMedia(getUserMedia);
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<Probe />);
    });
    await act(async () => {});
    expect(latest.current).toMatchObject({ available: true, canFlip: true, status: "idle" });

    await act(async () => latest.current!.start());
    expect(latest.current).toMatchObject({ status: "live", permission: "granted", facing: "environment" });
    expect((view.getByTestId("video") as HTMLVideoElement).srcObject).toBe(stream);
    expect(getUserMedia.mock.calls[0][0]).toMatchObject({ video: { facingMode: { ideal: "environment" } } });

    await act(async () => latest.current!.flip());
    expect(latest.current!.facing).toBe("user");
    expect(getUserMedia.mock.calls[1][0]).toMatchObject({ video: { facingMode: { ideal: "user" } } });
    expect(stop).toHaveBeenCalled(); // the first stream was released before the second started

    await act(async () => latest.current!.stop());
    expect(latest.current!.status).toBe("idle");
    expect((view.getByTestId("video") as HTMLVideoElement).srcObject).toBeNull();
  });

  it("reports a refusal as denied, without hiding that a camera exists", async () => {
    stubMedia(() => Promise.reject(denied()));
    await act(async () => {
      render(<Probe />);
    });
    await act(async () => {});

    await act(async () => latest.current!.start());

    expect(latest.current).toMatchObject({
      status: "error",
      error: "denied",
      permission: "denied",
      available: true,
    });
  });

  it("is unsupported without getUserMedia", async () => {
    await act(async () => {
      render(<Probe />);
    });
    expect(latest.current!.permission).toBe("unsupported");
  });
});

describe("useCameraPermission", () => {
  const perm: { current: ReturnType<typeof useCameraPermission> | null } = { current: null };
  function PermProbe() {
    const value = useCameraPermission();
    useEffect(() => {
      perm.current = value;
    });
    return null;
  }

  it("probes the camera on request and remembers the answer", async () => {
    const { stream, stop } = fakeStream();
    stubMedia(() => Promise.resolve(stream));
    await act(async () => {
      render(<PermProbe />);
    });
    expect(perm.current!.permission).toBe("prompt");

    await act(async () => perm.current!.request());
    expect(perm.current!.permission).toBe("granted");
    expect(stop).toHaveBeenCalled(); // the probe never leaves the camera on

    stubMedia(() => Promise.reject(denied()));
    await act(async () => perm.current!.request());
    expect(perm.current!.permission).toBe("denied");
  });
});
