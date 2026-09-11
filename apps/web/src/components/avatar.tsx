/**
 * Reusable Avatar component.
 *
 * Renders either a DiceBear/uploaded avatar image or a two-letter initials
 * placeholder.
 */

/** Two-letter initials — "Ada Lovelace" → "AL", unknown → "?". */
export function initialsOf(name: string | null | undefined): string {
  const letters = (name ?? "")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return letters || "?";
}

interface AvatarProps {
  /** Avatar URL (DiceBear, R2, or any image). */
  url: string | null | undefined;
  /** Full name — used for initials fallback. */
  name: string | null | undefined;
  /** Pixel size (default 44). Ignored when `className` is set. */
  size?: number;
  /**
   * Extra Tailwind classes merged onto the element.  When set the
   * component skips the default inline `width`/`height`/`fontSize`
   * styles, so include sizing classes (e.g. `h-11 w-11`) yourself.
   */
  className?: string;
}

/**
 * A single avatar circle. Shows the `url` image when available, otherwise
 * renders a coloured circle with initials.
 */
export function Avatar({ url, name, size = 44, className }: AvatarProps) {
  const useDefault = !className;
  const sizeStyle = useDefault
    ? { width: `${size}px`, height: `${size}px` }
    : undefined;

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`rounded-full object-cover ${className ?? ""}`}
        style={sizeStyle}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-bg-tertiary font-semibold text-text-secondary ${className ?? ""}`}
      style={
        useDefault
          ? { ...sizeStyle, fontSize: `${Math.max(10, size * 0.32)}px` }
          : undefined
      }
    >
      {initialsOf(name)}
    </div>
  );
}
