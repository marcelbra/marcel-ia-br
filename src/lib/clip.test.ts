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
  const art = Array.from({ length: 6 }, () => "X".repeat(40)).join("\n");

  it("leaves art that fits alone", () => {
    expect(clipAscii(art, 40)).toBe(art);
    expect(clipAscii(art, 80)).toBe(art);
  });

  it("marks the cut once, with the big dots on the baseline", () => {
    const lines = clipAscii(art, 30).split("\n");
    expect(lines[4].endsWith(ASCII_DOTS[0])).toBe(true);
    expect(lines[5].endsWith(ASCII_DOTS[1])).toBe(true);
    // The rows above carry no dots of their own.
    expect(lines.slice(0, 4).every((line) => line === "X".repeat(18))).toBe(true);
  });

  it("never spills past the capacity", () => {
    for (const capacity of [30, 20, 13, 12, 8, 1]) {
      expect(clipAscii(art, capacity).split("\n").every((l) => l.length <= capacity)).toBe(true);
    }
  });

  it("leaves the art alone while the width is unknown", () => {
    expect(clipAscii(art, 0)).toBe(art);
  });
});
