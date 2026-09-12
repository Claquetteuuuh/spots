/** Small geometry for pinch gestures built on pointer events. */
export interface Point {
  x: number;
  y: number;
}

/** How far apart the first two pointers are. */
export function distance(points: Map<number, Point>): number {
  const [a, b] = [...points.values()];
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Halfway between the first two pointers. */
export function midpoint(points: Map<number, Point>): Point {
  const [a, b] = [...points.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** A client point measured from a frame's centre — where zoom happens. */
export function fromCentre(frame: DOMRect | undefined, clientX: number, clientY: number): Point {
  if (!frame) return { x: 0, y: 0 };
  return { x: clientX - frame.left - frame.width / 2, y: clientY - frame.top - frame.height / 2 };
}
