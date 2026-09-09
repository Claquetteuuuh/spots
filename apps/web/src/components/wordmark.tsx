/**
 * The spots wordmark: "spots" set in Fredoka with the o replaced by a filled
 * circle — a spot on a map, dropped into the name.
 *
 * The circle is deliberately larger than the letter it stands in for, so it
 * reads as a marker rather than a typographic quirk. It inherits `currentColor`,
 * so the mark can sit in brand blue on white, or white on a photograph, without
 * a second asset.
 */
export function Wordmark({
  className = "",
  dotClassName = "",
}: {
  /** Controls size (via font-size) and colour (via text colour). */
  className?: string;
  /** Optional override for the dot alone — e.g. to keep it blue on dark type. */
  dotClassName?: string;
}) {
  return (
    <span
      role="img"
      aria-label="spots"
      className={`font-display inline-flex select-none items-baseline font-semibold leading-none tracking-[-0.01em] ${className}`}
    >
      sp
      <span
        aria-hidden="true"
        className={`mx-[0.045em] inline-block h-[0.66em] w-[0.66em] shrink-0 translate-y-[0.015em] rounded-full bg-current ${dotClassName}`}
      />
      ts
    </span>
  );
}
