import { describe, it, expect } from "vitest";
import { ASCII_DOTS, clip, clipAscii } from "./clip";

describe("clip", () => {
  it("leaves text that fits alone", () => {
    expect(clip("hello", 5)).toBe("hello");
    expect(clip("hello", 80)).toBe("hello");
  });

  it("marks a cut with three ascii dots and stays within the capacity", () => {
    expect(clip("hello world", 8)).toBe("hello...");
    expect(clip("hello world", 8)).toHaveLength(8);
  });

  it("treats an unmeasured capacity as unknown and never guesses", () => {
    expect(clip("hello world", 0)).toBe("hello world");
    expect(clip("hello world", -1)).toBe("hello world");
  });

  it("degrades to bare dots when there is no room for any text", () => {
    expect(clip("hello", 3)).toBe("...");
    expect(clip("hello", 2)).toBe("..");
  });
});

describe("clipAscii", () => {
  // Four letters, 10 + 8 + 10 + 8 columns wide.
  const LETTERS = [10, 8, 10, 8];
  const art = Array.from({ length: 6 }, () => "AAAAAAAAAABBBBBBBBCCCCCCCCCCDDDDDDDD").join("\n");
  const dotted = (kept: string, row: 0 | 1) => `${kept} ${ASCII_DOTS[row]}`;

  it("leaves art that fits alone", () => {
    expect(clipAscii(art, LETTERS, 36)).toBe(art);
    expect(clipAscii(art, LETTERS, 80)).toBe(art);
  });

  it("drops whole letters, never part of one", () => {
    const lines = clipAscii(art, LETTERS, 30).split("\n");
    // A and B fit alongside the 12-column ellipsis, C does not.
    expect(lines[0]).toBe("AAAAAAAAAABBBBBBBB");
    expect(lines[4]).toBe(dotted("AAAAAAAAAABBBBBBBB", 0));
    expect(lines[5]).toBe(dotted("AAAAAAAAAABBBBBBBB", 1));
  });

  it("takes the next letter away one column too early, not one column late", () => {
    expect(clipAscii(art, LETTERS, 29).split("\n")[0]).toBe("AAAAAAAAAA");
    expect(clipAscii(art, LETTERS, 30).split("\n")[0]).toBe("AAAAAAAAAABBBBBBBB");
  });

  it("puts the dots against the last letter left standing", () => {
    const lines = clipAscii(art, LETTERS, 29).split("\n");
    expect(lines[4]).toBe(dotted("AAAAAAAAAA", 0));
    expect(lines[5]).toBe(dotted("AAAAAAAAAA", 1));
  });

  it("never spills past the capacity", () => {
    for (const capacity of [35, 30, 22, 21, 12, 5, 1]) {
      expect(clipAscii(art, LETTERS, capacity).split("\n").every((l) => l.length <= capacity)).toBe(true);
    }
  });

  it("leaves the art alone while the width is unknown", () => {
    expect(clipAscii(art, LETTERS, 0)).toBe(art);
  });
});
