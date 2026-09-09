/**
 * Static analysis test: verify all React hooks in SpotDetailPage are called
 * before any early return. Prevents the "Rendered more hooks than during
 * the previous render" regression.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SRC = fs.readFileSync(
  path.resolve(__dirname, "../page.tsx"),
  "utf-8",
);

function extractFunctionBody(source: string, fnName: string): string {
  // Match "export default function X(" or "function X("
  const sigPattern = new RegExp(
    `(?:export\\s+(?:default\\s+)?)?function\\s+${fnName}\\s*\\(`,
  );
  const match = sigPattern.exec(source);
  if (!match) throw new Error(`Function ${fnName} not found`);

  // Skip past parameter list
  let parenDepth = 1;
  let idx = match.index + match[0].length;
  while (idx < source.length && parenDepth > 0) {
    if (source[idx] === "(") parenDepth++;
    else if (source[idx] === ")") parenDepth--;
    idx++;
  }

  // Find the opening `{` of the function body
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

function stripStringsAndComments(code: string): string {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/`(?:[^`\\]|\\.)*`/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, '""');
}

function findTopLevelReturns(body: string): number[] {
  const cleaned = stripStringsAndComments(body);
  const lines = cleaned.split("\n");
  const returnLines: number[] = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const depthAtStart = depth;
    for (const ch of lines[i]) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
    }
    if (depthAtStart === 0 && /\breturn\b/.test(lines[i])) {
      returnLines.push(i);
    }
  }
  return returnLines;
}

function findTopLevelHookCalls(
  body: string,
): { line: number; hook: string }[] {
  const cleaned = stripStringsAndComments(body);
  const lines = cleaned.split("\n");
  const hooks: { line: number; hook: string }[] = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const depthAtStart = depth;
    for (const ch of lines[i]) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
    }
    if (depthAtStart === 0) {
      const hookMatch = lines[i].match(/\b(use[A-Z]\w*)\b/);
      if (hookMatch) {
        hooks.push({ line: i, hook: hookMatch[1] });
      }
    }
  }
  return hooks;
}

describe("SpotDetailPage — hooks order regression", () => {
  const body = extractFunctionBody(SRC, "SpotDetailPage");
  const earlyReturns = findTopLevelReturns(body);
  const hookCalls = findTopLevelHookCalls(body);

  it("should find hook calls in the component", () => {
    expect(hookCalls.length).toBeGreaterThan(0);
  });

  it("should have early return guards", () => {
    expect(earlyReturns.length).toBeGreaterThanOrEqual(1);
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
});
