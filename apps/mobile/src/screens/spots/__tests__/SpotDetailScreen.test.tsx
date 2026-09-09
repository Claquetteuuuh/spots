/**
 * Regression tests for SpotDetailScreen.
 *
 * The original bug: `useCallback` for `renderCarouselItem` was placed AFTER
 * early returns (loading / error guards), so on the first render (loading)
 * the hook wasn't reached, but on re-render (data loaded) it was — violating
 * React's Rules of Hooks and crashing with "Rendered more hooks than during
 * the previous render".
 *
 * These tests verify the fix at the source level: every hook call must appear
 * before any early `return` statement in the component body.
 */

import fs from "fs";
import path from "path";

const SRC = fs.readFileSync(
  path.resolve(__dirname, "../SpotDetailScreen.tsx"),
  "utf-8",
);

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Extract the body of a function from source by finding the opening `{`
 * of the function body (after the parameter list's `)`) and matching braces.
 */
function extractFunctionBody(source: string, fnName: string): string {
  const sigPattern = new RegExp(
    `(?:export\\s+)?function\\s+${fnName}\\s*\\(`,
  );
  const match = sigPattern.exec(source);
  if (!match) throw new Error(`Function ${fnName} not found in source`);

  // Skip past the parameter list — find the matching `)` for the `(`
  let parenDepth = 1;
  let idx = match.index + match[0].length; // right after the `(`
  while (idx < source.length && parenDepth > 0) {
    if (source[idx] === "(") parenDepth++;
    else if (source[idx] === ")") parenDepth--;
    idx++;
  }

  // Now find the `{` that opens the function body
  idx = source.indexOf("{", idx);
  if (idx === -1) throw new Error(`Opening brace not found for ${fnName}`);

  let braceDepth = 1;
  idx++;
  const start = idx;
  while (idx < source.length && braceDepth > 0) {
    const ch = source[idx];
    if (ch === "{") braceDepth++;
    else if (ch === "}") braceDepth--;
    idx++;
  }
  return source.slice(start, idx - 1);
}

/**
 * Strip string literals, template literals, and comments.
 */
function stripStringsAndComments(code: string): string {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/`(?:[^`\\]|\\.)*`/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, '""');
}

/**
 * Find lines where brace depth is 0 at the START of the line and the line
 * contains a `return` statement — these are top-level early returns.
 */
function findTopLevelReturns(body: string): number[] {
  const cleaned = stripStringsAndComments(body);
  const lines = cleaned.split("\n");
  const returnLines: number[] = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const depthAtStart = depth;

    for (const ch of line) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
    }

    if (depthAtStart === 0 && /\breturn\b/.test(line)) {
      returnLines.push(i);
    }
  }

  return returnLines;
}

/**
 * Find lines where brace depth is 0 at the START and the line calls a
 * React hook (useXxx pattern).
 */
function findTopLevelHookCalls(
  body: string,
): { line: number; hook: string }[] {
  const cleaned = stripStringsAndComments(body);
  const lines = cleaned.split("\n");
  const hooks: { line: number; hook: string }[] = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const depthAtStart = depth;

    for (const ch of line) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
    }

    if (depthAtStart === 0) {
      const hookMatch = line.match(/\b(use[A-Z]\w*)\b/);
      if (hookMatch) {
        hooks.push({ line: i, hook: hookMatch[1] });
      }
    }
  }

  return hooks;
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("SpotDetailScreen — hooks order regression", () => {
  const body = extractFunctionBody(SRC, "SpotDetailScreen");
  const earlyReturns = findTopLevelReturns(body);
  const hookCalls = findTopLevelHookCalls(body);

  it("should have the function body available for analysis", () => {
    expect(body.length).toBeGreaterThan(100);
  });

  it("should have at least one early return (loading/error guard)", () => {
    expect(earlyReturns.length).toBeGreaterThanOrEqual(1);
  });

  it("should have hook calls in the function body", () => {
    expect(hookCalls.length).toBeGreaterThan(0);
  });

  it("all hook calls must come BEFORE any early return", () => {
    if (earlyReturns.length === 0 || hookCalls.length === 0) return;

    const firstReturn = Math.min(...earlyReturns);

    const violating = hookCalls.filter((h) => h.line > firstReturn);

    if (violating.length > 0) {
      const details = violating
        .map(
          (h) =>
            `  ${h.hook} at line ~${h.line + 1} (first early return at ~${firstReturn + 1})`,
        )
        .join("\n");
      throw new Error(
        `React hooks placed after early returns will cause "Rendered more hooks" error:\n${details}`,
      );
    }
  });

  it("useCallback must be before early returns (specific regression)", () => {
    const useCallbacks = hookCalls.filter((h) => h.hook === "useCallback");
    expect(useCallbacks.length).toBeGreaterThan(0);

    if (earlyReturns.length > 0) {
      const firstReturn = Math.min(...earlyReturns);
      for (const cb of useCallbacks) {
        expect(cb.line).toBeLessThan(firstReturn);
      }
    }
  });
});
