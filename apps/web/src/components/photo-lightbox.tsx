"use client";

import { useEffect, useRef, useState } from "react";
import { IDENTITY, pan, toggleZoom, wheelFactor, zoomAround, type ZoomState } from "@/lib/zoom";
import { useT } from "@/lib/use-t";

interface PhotoLightboxProps {
  urls: string[];
  index: number;
  alt: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * A photo over everything, on black. Scroll, pinch or double-tap to zoom,
 * drag to look around; arrows step through the spot's photos; Escape, the
 * cross or a tap beside the photo close it.
 */
export function PhotoLightbox({ urls, index, alt, onIndexChange, onClose }: PhotoLightboxProps) {
  const t = useT();
  const hasMultiple = urls.length > 1;
  const count = urls.length;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (hasMultiple && e.key === "ArrowLeft") onIndexChange(index > 0 ? index - 1 : count - 1);
      else if (hasMultiple && e.key === "ArrowRight") onIndexChange(index < count - 1 ? index + 1 : 0);
    };
    document.addEventListener("keydown", onKeyDown);
    // The page behind must not scroll under the photo
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onIndexChange, hasMultiple, index, count]);

  const arrowClass =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[1200] flex flex-col bg-black"
      data-testid="lightbox"
    >
      {/* Keyed on the index: a new photo starts back at 1× */}
      <ZoomableImage key={index} src={urls[index]} alt={alt} onClose={onClose} />

      <button
        type="button"
        onClick={onClose}
        aria-label={t("common.close")}
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
        data-testid="lightbox-close"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={() => onIndexChange(index > 0 ? index - 1 : count - 1)}
            aria-label={`${index}/${count}`}
            className={`left-4 ${arrowClass}`}
            data-testid="lightbox-prev"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onIndexChange(index < count - 1 ? index + 1 : 0)}
            aria-label={`${index + 2}/${count}`}
            className={`right-4 ${arrowClass}`}
            data-testid="lightbox-next"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          <span className="pointer-events-none absolute left-4 top-[calc(env(safe-area-inset-top)+1.25rem)] rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
            {index + 1}/{count}
          </span>
        </>
      ) : null}

      <p className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white/60">
        {t("spots.zoomHint")}
      </p>
    </div>
  );
}

interface Point {
  x: number;
  y: number;
}

function distance(points: Map<number, Point>): number {
  const [a, b] = [...points.values()];
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(points: Map<number, Point>): Point {
  const [a, b] = [...points.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function ZoomableImage({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [zoom, setZoom] = useState<ZoomState>(IDENTITY);
  const frameRef = useRef<HTMLDivElement>(null);
  // Fingers (or the mouse) currently down, by pointer id
  const pointers = useRef(new Map<number, Point>());
  const pinchDistance = useRef<number | null>(null);
  const moved = useRef(false);
  const downBesidePhoto = useRef(false);

  /** A client point measured from the frame's centre — where zoom happens. */
  const fromCentre = (clientX: number, clientY: number): Point => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  };

  const onWheel = (e: React.WheelEvent) => {
    const p = fromCentre(e.clientX, e.clientY);
    setZoom((z) => zoomAround(z, wheelFactor(e.deltaY), p.x, p.y));
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const p = fromCentre(e.clientX, e.clientY);
    setZoom((z) => toggleZoom(z, p.x, p.y));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const frame = e.currentTarget;
    // Keep following the finger even once it leaves the frame (not in jsdom)
    if ("setPointerCapture" in frame) frame.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    downBesidePhoto.current = e.target === frame;
    if (pointers.current.size === 2) pinchDistance.current = distance(pointers.current);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const before = pointers.current.get(e.pointerId);
    if (!before) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchDistance.current) {
      const d = distance(pointers.current);
      const factor = d / pinchDistance.current;
      pinchDistance.current = d;
      const mid = midpoint(pointers.current);
      const p = fromCentre(mid.x, mid.y);
      moved.current = true;
      setZoom((z) => zoomAround(z, factor, p.x, p.y));
    } else if (pointers.current.size === 1) {
      const dx = e.clientX - before.x;
      const dy = e.clientY - before.y;
      if (dx || dy) moved.current = true;
      setZoom((z) => pan(z, dx, dy));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinchDistance.current = null;
  };

  // A tap on the black beside the photo closes; a drag or a tap on it does not
  const onClick = () => {
    if (downBesidePhoto.current && !moved.current) onClose();
  };

  return (
    <div
      ref={frameRef}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      className={`relative flex-1 touch-none select-none overflow-hidden ${
        zoom.scale > 1 ? "cursor-grab" : "cursor-zoom-in"
      }`}
      data-testid="lightbox-frame"
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute inset-0 m-auto max-h-full max-w-full"
        style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})` }}
        data-testid="lightbox-image"
      />
    </div>
  );
}
