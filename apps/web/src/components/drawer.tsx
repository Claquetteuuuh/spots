"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** How long the sheet takes to slide, on the curve vaul uses. */
export const DRAWER_DURATION_MS = 320;
const DRAWER_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
/** Let go past this share of the sheet's height and it closes… */
const CLOSE_FRACTION = 0.25;
/** …or flick it down faster than this, in px per ms. */
const CLOSE_VELOCITY = 0.5;

type Phase = "closed" | "entering" | "open" | "leaving";

interface DrawerProps {
  open: boolean;
  /** The sheet has slid away — a drag, the backdrop, Escape — so drop `open`. */
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** Extra classes on the sheet — its height cap, mostly. */
  className?: string;
  id?: string;
}

/**
 * A bottom sheet in the style of shadcn's drawer: slides up from the
 * bottom edge, pulls down by its grip, and closes when let go far or fast
 * enough. Below `lg` only — desktop gets dropdowns.
 */
export function Drawer({ open, onClose, label, children, className = "", id }: DrawerProps) {
  const [phase, setPhase] = useState<Phase>(open ? "entering" : "closed");
  const [wasOpen, setWasOpen] = useState(open);
  // Where a finger holds the sheet, in px below its resting place
  const [drag, setDrag] = useState<number | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const grip = useRef<{ id: number; startY: number; lastY: number; lastT: number; velocity: number } | null>(null);
  const closeRequested = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // `open` flipped: start sliding in, or out
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPhase("entering");
    else if (phase === "entering" || phase === "open") setPhase("leaving");
  }

  useEffect(() => {
    if (phase === "entering") {
      // Two frames at the bottom, so the slide has a painted place to start from
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setPhase("open"));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    if (phase === "leaving") {
      const timer = setTimeout(() => {
        setPhase("closed");
        if (closeRequested.current) {
          closeRequested.current = false;
          onCloseRef.current();
        }
      }, DRAWER_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  /** Slide out, then tell the owner. */
  const requestClose = useCallback(() => {
    closeRequested.current = true;
    setPhase("leaving");
  }, []);

  useEffect(() => {
    if (phase !== "open") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [phase, requestClose]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "open") return;
    const zone = e.currentTarget;
    // Keep following the finger once it leaves the grip (not in jsdom)
    if ("setPointerCapture" in zone) zone.setPointerCapture(e.pointerId);
    grip.current = { id: e.pointerId, startY: e.clientY, lastY: e.clientY, lastT: performance.now(), velocity: 0 };
    setSheetHeight(sheetRef.current?.offsetHeight ?? 0);
    setDrag(0);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    const now = performance.now();
    g.velocity = (e.clientY - g.lastY) / Math.max(1, now - g.lastT);
    g.lastY = e.clientY;
    g.lastT = now;
    setDrag(Math.max(0, e.clientY - g.startY));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    grip.current = null;
    const travelled = Math.max(0, e.clientY - g.startY);
    setDrag(null);
    if (travelled > sheetHeight * CLOSE_FRACTION || g.velocity > CLOSE_VELOCITY) requestClose();
  };

  if (phase === "closed") return null;

  const shown = phase === "open";
  const moving = drag !== null;
  // The backdrop thins as the sheet is pulled down
  const progress = !shown ? 0 : moving && sheetHeight > 0 ? 1 - Math.min(1, drag / sheetHeight) : 1;
  const ease = moving ? "none" : `${DRAWER_DURATION_MS}ms ${DRAWER_EASE}`;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={requestClose}
        className="fixed inset-0 z-[1090] bg-text/30"
        style={{ opacity: progress, transition: moving ? "none" : `opacity ${ease}` }}
        data-testid="drawer-backdrop"
      />
      <div
        ref={sheetRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`fixed inset-x-0 bottom-0 z-[1100] flex flex-col rounded-t-[24px] border border-border bg-bg shadow-float ${className}`}
        style={{
          transform: shown ? `translateY(${drag ?? 0}px)` : "translateY(100%)",
          transition: moving ? "none" : `transform ${ease}`,
        }}
        data-state={phase}
        data-testid="drawer"
      >
        {/* The grip: pull here to bring the sheet down */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex shrink-0 cursor-grab touch-none items-center justify-center pb-2 pt-3 active:cursor-grabbing"
          data-testid="drawer-grip"
        >
          <span aria-hidden="true" className="h-1 w-9 rounded-full bg-border" />
        </div>
        {children}
      </div>
    </>
  );
}
