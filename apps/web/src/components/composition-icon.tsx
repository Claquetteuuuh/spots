import type { SVGProps } from "react";
import type { CompositionType } from "@trs/shared/constants";

/**
 * The composition glyphs, ported one for one from the mobile app's
 * `CompositionIcon` (AddSpotScreen.tsx): minimal geometric marks drawn on a
 * 26×26 box. Everything is `currentColor`, so the cell that holds the icon
 * decides whether it reads in brand blue (selected) or secondary text.
 */
const GLYPHS: Record<CompositionType, React.ReactNode> = {
  SYMMETRY: (
    <>
      <rect x="12" y="2" width="2" height="22" />
      <rect x="4" y="6" width="6" height="14" />
      <rect x="16" y="6" width="6" height="14" />
    </>
  ),
  ASYMMETRY: (
    <>
      <rect x="4" y="4" width="8" height="8" />
      <rect x="16" y="16" width="6" height="6" />
    </>
  ),
  FRAME_IN_FRAME: (
    <g fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="1" y="1" width="24" height="24" />
      <rect x="8" y="8" width="10" height="10" />
    </g>
  ),
  FIBONACCI: (
    <g fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="0.75" y="0.75" width="24.5" height="24.5" />
      <rect x="0.75" y="10.75" width="14.5" height="14.5" />
      <rect x="0.75" y="16.75" width="8.5" height="8.5" />
    </g>
  ),
  RULE_OF_THIRDS: (
    <>
      <rect x="8" y="0" width="1.5" height="26" />
      <rect x="16" y="0" width="1.5" height="26" />
      <rect x="0" y="8" width="26" height="1.5" />
      <rect x="0" y="16" width="26" height="1.5" />
    </>
  ),
  LEADING_LINES: (
    <>
      <rect x="12" y="0" width="2" height="20" transform="rotate(20 13 10)" />
      <rect x="12" y="0" width="2" height="20" transform="rotate(-20 13 10)" />
    </>
  ),
  DIAGONAL: <rect x="12" y="0" width="2" height="26" transform="rotate(35 13 13)" />,
  CENTERED: <circle cx="13" cy="13" r="4" />,
  MINIMALIST: <rect x="18" y="18" width="5" height="5" />,
  PATTERN: (
    <>
      {[0, 6, 12].map((y) =>
        [0, 6, 12].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" />),
      )}
    </>
  ),
  // The app draws nothing for "Other"; three dots keep the cell from looking empty.
  OTHER: (
    <>
      <circle cx="5" cy="13" r="2" />
      <circle cx="13" cy="13" r="2" />
      <circle cx="21" cy="13" r="2" />
    </>
  ),
};

interface CompositionIconProps extends Omit<SVGProps<SVGSVGElement>, "type"> {
  type: CompositionType;
}

export function CompositionIcon({ type, className = "h-7 w-7", ...props }: CompositionIconProps) {
  return (
    <svg
      viewBox="0 0 26 26"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {GLYPHS[type]}
    </svg>
  );
}
