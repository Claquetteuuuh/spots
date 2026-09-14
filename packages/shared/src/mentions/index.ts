/**
 * Naming someone with an `@`. A caption keeps the text the photographer
 * typed; who it points at is worked out from it — once on the server, to
 * record the mention, and once at render, to draw the link.
 */

/** Usernames are letters, digits and underscores, up to 30 (see `registerSchema`). */
const HANDLE = /@([a-zA-Z0-9_]{1,30})/g;

/** How many photos one post may carry — enough to fan out, few enough to read. */
export const MAX_POST_PHOTOS = 5;

/** Every `@name` in a text, lowercased and without repeats, in order. */
export function parseMentions(text: string | null | undefined): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  for (const [, handle] of text.matchAll(HANDLE)) seen.add(handle.toLowerCase());
  return [...seen];
}

/** A run of text, or the person named in it. */
export type CaptionPart =
  | { kind: "text"; text: string }
  | { kind: "mention"; text: string; username: string };

/**
 * Split a caption into what to print and what to link. Only names that
 * resolved to a real account become links — an `@` in front of anything
 * else is just an `@`.
 */
export function splitCaption(text: string, usernames: string[]): CaptionPart[] {
  const known = new Map(usernames.map((u) => [u.toLowerCase(), u]));
  const parts: CaptionPart[] = [];
  let last = 0;

  for (const match of text.matchAll(HANDLE)) {
    const username = known.get(match[1].toLowerCase());
    if (!username) continue;
    const start = match.index ?? 0;
    if (start > last) parts.push({ kind: "text", text: text.slice(last, start) });
    parts.push({ kind: "mention", text: match[0], username });
    last = start + match[0].length;
  }

  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

/**
 * The handle being typed at the caret, if any: what an editor needs to
 * offer names for. Null once the word is finished or nothing is being
 * named.
 */
export function mentionQueryAt(text: string, caret: number): { query: string; start: number } | null {
  const upTo = text.slice(0, caret);
  const at = upTo.lastIndexOf("@");
  if (at === -1) return null;
  // An @ only starts a name at the beginning of a word
  if (at > 0 && !/\s/.test(upTo[at - 1])) return null;
  const query = upTo.slice(at + 1);
  if (!/^[a-zA-Z0-9_]{0,30}$/.test(query)) return null;
  return { query, start: at };
}

/** Put a chosen name in place of the handle being typed. */
export function applyMention(
  text: string,
  start: number,
  caret: number,
  username: string,
): { text: string; caret: number } {
  const next = `${text.slice(0, start)}@${username} `;
  return { text: next + text.slice(caret), caret: next.length };
}
