"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraPermission = "prompt" | "granted" | "denied" | "unsupported";
export type CameraFacing = "user" | "environment";
export type CameraError = "denied" | "unavailable" | "unknown";

/** What the browser says, when it can say anything (Safari cannot). */
async function queryPermission(): Promise<CameraPermission | null> {
  try {
    const status = await navigator.permissions?.query({ name: "camera" as PermissionName });
    if (!status) return null;
    return status.state === "granted" ? "granted" : status.state === "denied" ? "denied" : "prompt";
  } catch {
    return null;
  }
}

function classify(err: unknown): CameraError {
  const name = (err as { name?: string } | null)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError") {
    return "unavailable";
  }
  return "unknown";
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

/**
 * Live preview and capture through getUserMedia. The stream is attached
 * the moment the <video> mounts (callback ref), so it never plays to an
 * element that is not there yet, and it is torn down on stop and unmount.
 */
export function useCamera() {
  const [permission, setPermission] = useState<CameraPermission>(() =>
    typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function"
      ? "prompt"
      : "unsupported",
  );
  const [available, setAvailable] = useState(false);
  const [canFlip, setCanFlip] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("environment");
  const [status, setStatus] = useState<"idle" | "starting" | "live" | "error">("idle");
  const [error, setError] = useState<CameraError | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === "videoinput");
      setAvailable(inputs.length > 0);
      setCanFlip(inputs.length > 1);
    } catch {
      // No device API — leave things as they are
    }
  }, []);

  // What we know before asking: devices (labels come after permission) and the permission itself
  useEffect(() => {
    if (permission === "unsupported") return;
    void Promise.resolve().then(refreshDevices);
    let status: PermissionStatus | null = null;
    void queryPermission().then((p) => {
      if (p) setPermission(p);
    });
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((s) => {
        status = s;
        s.onchange = () => void queryPermission().then((p) => p && setPermission(p));
      })
      .catch(() => {});
    return () => {
      if (status) status.onchange = null;
    };
  }, [permission === "unsupported", refreshDevices]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback((el: HTMLVideoElement, stream: MediaStream) => {
    el.srcObject = stream;
    el.muted = true;
    el.playsInline = true;
    // play() may reject (autoplay policy) or, in odd engines, not return a promise
    const attempt = () => {
      try {
        void Promise.resolve(el.play()).catch(() => {});
      } catch {
        // Not playable yet — onloadedmetadata tries again
      }
    };
    attempt();
    el.onloadedmetadata = attempt;
  }, []);

  /** Callback ref for the <video>: attaches whatever stream is live. */
  const attachVideo = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el && streamRef.current) play(el, streamRef.current);
    },
    [play],
  );

  const open = useCallback(
    async (nextFacing: CameraFacing) => {
      setStatus("starting");
      setError(null);
      stopStream(streamRef.current);
      streamRef.current = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: nextFacing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        setPermission("granted");
        setFacing(nextFacing);
        if (videoRef.current) play(videoRef.current, stream);
        setStatus("live");
        // With permission granted, devices now carry labels and the real count
        void refreshDevices();
      } catch (err) {
        const kind = classify(err);
        if (kind === "denied") setPermission("denied");
        setError(kind);
        setStatus("error");
      }
    },
    [play, refreshDevices],
  );

  const start = useCallback(() => open(facing), [open, facing]);
  const flip = useCallback(
    () => open(facing === "user" ? "environment" : "user"),
    [open, facing],
  );

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
    setError(null);
  }, []);

  /** A JPEG of the current frame, or null when nothing is playing yet. */
  const capture = useCallback((): Promise<File | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return Promise.resolve(null);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" }) : null),
        "image/jpeg",
        0.92,
      );
    });
  }, []);

  // Never leave a camera light on after the page is gone
  useEffect(() => () => stopStream(streamRef.current), []);

  const getVideo = useCallback(() => videoRef.current, []);

  return {
    permission,
    available,
    canFlip,
    facing,
    status,
    error,
    /** The mounted <video>, for callers that draw from it themselves. */
    getVideo,
    attachVideo,
    start,
    stop,
    flip,
    capture,
  };
}

/**
 * Just the permission, for Settings: what it is now, and a way to ask
 * (a probe that opens and immediately closes the camera). A refusal the
 * browser remembers cannot be re-asked from a page — say so.
 */
export function useCameraPermission() {
  const [permission, setPermission] = useState<CameraPermission>(() =>
    typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function"
      ? "prompt"
      : "unsupported",
  );

  useEffect(() => {
    if (permission === "unsupported") return;
    void queryPermission().then((p) => {
      if (p) setPermission(p);
    });
  }, [permission === "unsupported"]); // eslint-disable-line react-hooks/exhaustive-deps

  const request = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stopStream(stream);
      setPermission("granted");
    } catch (err) {
      setPermission(classify(err) === "denied" ? "denied" : permission);
    }
  }, [permission]);

  return { permission, request };
}
