import { describe, it, expect } from "vitest";
import {
  applyMention,
  mentionQueryAt,
  parseMentions,
  splitCaption,
} from "../mentions";

describe("parseMentions", () => {
  it("finds every name once, whatever the case", () => {
    expect(parseMentions("bravo @alice et @Bob, merci @alice")).toEqual(["alice", "bob"]);
  });

  it("stops at the first character a username cannot have", () => {
    expect(parseMentions("@alice-dupont, @bob.")).toEqual(["alice", "bob"]);
    expect(parseMentions("mail@example.com")).toEqual(["example"]);
  });

  it("has nothing to find in an empty caption", () => {
    expect(parseMentions(null)).toEqual([]);
    expect(parseMentions("no one here")).toEqual([]);
  });
});

describe("splitCaption", () => {
  it("links the names that turned out to be accounts, and only those", () => {
    const parts = splitCaption("thanks @alice and @ghost", ["alice"]);

    expect(parts).toEqual([
      { kind: "text", text: "thanks " },
      { kind: "mention", text: "@alice", username: "alice" },
      { kind: "text", text: " and @ghost" },
    ]);
  });

  it("keeps the account's own spelling, not the typed one", () => {
    expect(splitCaption("@ALICE", ["alice"])[0]).toEqual({
      kind: "mention",
      text: "@ALICE",
      username: "alice",
    });
  });

  it("leaves a caption without names in one piece", () => {
    expect(splitCaption("just a photo", [])).toEqual([{ kind: "text", text: "just a photo" }]);
  });
});

describe("mentionQueryAt", () => {
  it("offers names for the handle under the caret", () => {
    expect(mentionQueryAt("hi @al", 6)).toEqual({ query: "al", start: 3 });
    expect(mentionQueryAt("@", 1)).toEqual({ query: "", start: 0 });
  });

  it("says nothing when no one is being named", () => {
    expect(mentionQueryAt("hello", 5)).toBeNull();
    expect(mentionQueryAt("hi @al bob", 10)).toBeNull(); // the word is finished
    expect(mentionQueryAt("mail@example", 12)).toBeNull(); // an address, not a name
  });

  it("puts the chosen name in place of what was typed", () => {
    expect(applyMention("hi @al", 3, 6, "alice")).toEqual({ text: "hi @alice ", caret: 10 });
    // …and keeps what came after the caret
    expect(applyMention("hi @al!", 3, 6, "alice")).toEqual({ text: "hi @alice !", caret: 10 });
  });
});
