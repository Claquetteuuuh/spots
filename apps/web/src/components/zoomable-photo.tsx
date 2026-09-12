"use client";

import { useEffect, useRef, useState } from "react";
import { IDENTITY, wheelFactor, zoomAround, type ZoomState } from "@/lib/zoom";
import { distance, fromCentre, midpoint, type Point } from "@/lib/pointers";

/** After the last trackpad notch, the photo settles back. */
const SETTLE_AFTER_MS = 350;
const SETTLE_EASE = "transform 240ms cubic-bezier(0.32, 0.72, 0, 1)";

interface ZoomablePhotoProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * A photo that grows under a pinch — two fingers, or a trackpad pinch —
 * right where it is, and settles back when let go. One finger still
 * scrolls the page, and a tap still does whatever the parent wants.
 */
export function ZoomablePhoto({ src, alt, className = "" }: ZoomablePhotoProps) {
  const [zoom, setZoom] = useState<ZoomState>(IDENTITY);
  const [pinching, setPinching] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinchDistance = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);

  // A trackpad pinch arrives as a wheel with ctrlKey; the page must not zoom instead.
  // React's own onWheel is passive, so the listener goes on by hand.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const p = fromCentre(frame.getBoundingClientRect(), e.clientX, e.clientY);
      setZoom((z) => zoomAround(z, wheelFactor(e.deltaY), p.x, p.y));
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => setZoom(IDENTITY), SETTLE_AFTER_MS);
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      frame.removeEventListener("wheel", onWheel);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      pinchDistance.current = distance(pointers.current);
      setPinching(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size !== 2 || !pinchDistance.current) return;

    const d = distance(pointers.current);
    const factor = d / pinchDistance.current;
    pinchDistance.current = d;
    const mid = midpoint(pointers.current);
    const p = fromCentre(frameRef.current?.getBoundingClientRect(), mid.x, mid.y);
    setZoom((z) => zoomAround(z, factor, p.x, p.y));
  };

  // A finger lifted (or the browser took over to scroll): the pinch is done
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2 && pinchDistance.current) {
      pinchDistance.current = null;
      setPinching(false);
      setZoom(IDENTITY);
    }
  };

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`relative h-full w-full touch-pan-y ${className}`}
      data-testid="zoomable-photo"
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-cover"
        style={{
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
          transition: pinching ? "none" : SETTLE_EASE,
        }}
        data-testid="zoomable-photo-image"
      />
    </div>
  );
}
