import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 16px inside, like the app. Turn off for edge-to-edge content (a photo, a list). */
  padded?: boolean;
}

/**
 * Flat card with a single hairline border — the app's Card. Separation from
 * the page comes from the border and a slightly different fill, never from a
 * drop shadow.
 */
export function Card({ padded = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      // `rounded-lg` is 16px on this project's remapped radius scale — the app's Card.
      className={`overflow-hidden rounded-lg border border-border bg-bg-secondary ${padded ? "p-4" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
