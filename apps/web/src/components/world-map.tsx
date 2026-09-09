import { MAP_CELLS, MAP_COLS, MAP_ROWS } from "./world-map-data";

const DOT_RADIUS = 0.42;

/**
 * All 1600-odd dots as a single path.
 *
 * One `<circle>` per cell is the obvious spelling, but it makes the server
 * component payload carry 1600 separate React elements. Collapsing them into
 * one element keeps the markup — and the flight data — small; the repeated arc
 * commands compress to almost nothing.
 */
const DOTS_PATH = MAP_CELLS.trim()
  .split(/\s+/)
  .map((pair) => {
    const [col, row] = pair.split(",").map(Number);
    const r = DOT_RADIUS;
    return `M${col - r} ${row}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
  })
  .join("");

/**
 * A handful of real places, snapped to the graticule, that light up in turn —
 * a spot being dropped somewhere in the world. Spread across continents and
 * hemispheres so the eye never sees two fire next to each other.
 */
const HIGHLIGHTS = [
  { col: 35, row: 10 }, // New York
  { col: 107, row: 11 }, // Tokyo
  { col: 46, row: 31 }, // Rio de Janeiro
  { col: 61, row: 8 }, // Paris
  { col: 110, row: 35 }, // Sydney
  { col: 66, row: 34 }, // Cape Town
  { col: 54, row: 2 }, // Reykjavík
];

/** One full pass through every highlight, in seconds. */
const CYCLE = 14;

/**
 * The dotted world map that sits behind the landing hero.
 *
 * Continents are drawn as spots — the same mark as the wordmark's `o` — so the
 * backdrop says what the product is instead of decorating around it. The base
 * map is deliberately faint, and its opacity is a theme token because the same
 * blue needs a different weight against white than against navy.
 *
 * The map fades out at the top and bottom rather than being cut off by the
 * section edge.
 *
 * Purely decorative, so it stays out of the accessibility tree. The pulse
 * respects `prefers-reduced-motion` via the global rule in globals.css.
 */
export function WorldMap({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${MAP_COLS} ${MAP_ROWS}`}
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full text-accent [mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_76%,transparent)] ${className}`}
    >
      <path
        d={DOTS_PATH}
        fill="currentColor"
        opacity="var(--opacity-world-map)"
      />

      {HIGHLIGHTS.map(({ col, row }, i) => {
        const delay = `${(i * CYCLE) / HIGHLIGHTS.length}s`;
        return (
          <g key={`${col},${row}`}>
            <circle
              className="world-map-ring"
              cx={col}
              cy={row}
              r={0.7}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.22}
              style={{ animationDelay: delay }}
            />
            <circle
              className="world-map-spot"
              cx={col}
              cy={row}
              r={0.62}
              fill="currentColor"
              style={{ animationDelay: delay }}
            />
          </g>
        );
      })}
    </svg>
  );
}
