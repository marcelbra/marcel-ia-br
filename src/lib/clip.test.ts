import { describe, it, expect } from "vitest";
import { clip, clipLines } from "./clip";

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

describe("clipLines", () => {
  it("cuts every long line of a block at the same column", () => {
    const block = "aaaaaaaa\nbbbbbbbb";
    expect(clipLines(block, 5)).toBe("aa...\nbb...");
  });

  it("leaves lines that already fit untouched", () => {
    expect(clipLines("ab\ncd", 5)).toBe("ab\ncd");
  });
});
