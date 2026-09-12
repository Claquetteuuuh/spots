"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

/** Two 40px round buttons, their gap and the edge padding. */
export const SWIPE_ACTIONS_WIDTH = 104;
/** Movement before we decide whether the finger is scrolling or sliding. */
const AXIS_LOCK_PX = 6;

/**
 * A list row that slides left under the finger to reveal actions, as in
 * a mail app. Where a pointer can hover, the same actions sit at the end
 * of the row and show on hover or focus instead — nothing to discover.
 */
export function SwipeRow({
  children,
  actions,
  className = "",
}: {
  children: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; offset: number } | null>(null);
  const axis = useRef<"x" | "y" | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    start.current = { x: e.clientX, y: e.clientY, offset };
    axis.current = null;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!axis.current) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis.current === "x") {
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
    if (axis.current !== "x") return;
    setOffset(Math.max(-SWIPE_ACTIONS_WIDTH, Math.min(0, s.offset + dx)));
  };

  const onPointerEnd = () => {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    // Past halfway stays open, otherwise the row springs back
    setOffset((o) => (o < -SWIPE_ACTIONS_WIDTH / 2 ? -SWIPE_ACTIONS_WIDTH : 0));
  };

  return (
    <li className={`group relative overflow-hidden ${className}`}>
      {/* Touch: behind the row, revealed by the slide */}
      <div
        className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 [@media(hover:hover)]:hidden"
        aria-hidden={offset === 0}
      >
        {actions}
      </div>

      <div
        className="relative flex items-center gap-3 bg-bg [touch-action:pan-y]"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform .2s ease-out",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {children}

        {/* Hover: at the end of the row, on hover or keyboard focus */}
        <div className="hidden shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:flex">
          {actions}
        </div>
      </div>
    </li>
  );
}
