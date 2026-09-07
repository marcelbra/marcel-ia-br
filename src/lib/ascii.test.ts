import { describe, it, expect } from "vitest";
import { splitLetters } from "./ascii";

// Four letters, 10 + 8 + 10 + 8 columns wide.
const LETTERS = [10, 8, 10, 8];
const art = Array.from({ length: 6 }, () => "AAAAAAAAAABBBBBBBBCCCCCCCCCCDDDDDDDD").join("\n");

describe("splitLetters", () => {
  it("cuts the art on the letter boundaries", () => {
    expect(splitLetters(art, LETTERS).map((block) => block.split("\n")[0])).toEqual([
      "AAAAAAAAAA",
      "BBBBBBBB",
      "CCCCCCCCCC",
      "DDDDDDDD",
    ]);
  });

  it("keeps the art whole — every letter is there, none is cut short", () => {
    const blocks = splitLetters(art, LETTERS);
    const rows = blocks.map((block) => block.split("\n"));
    expect(blocks).toHaveLength(4);
    expect(rows.every((block) => block.length === 6)).toBe(true);
    expect(rows[0].map((_, i) => rows.map((block) => block[i]).join("")).join("\n")).toBe(art);
  });

  it("pads a ragged row out, so the letters below it stay in their columns", () => {
    // The trailing space of a row that ends early belongs to the last letter,
    // not to whichever one happens to follow the gap.
    const ragged = ["AAAAAAAAAABBBBBBBB", "AAAAAAAAAA"].join("\n");
    expect(splitLetters(ragged, [10, 8])).toEqual(["AAAAAAAAAA\nAAAAAAAAAA", "BBBBBBBB\n        "]);
  });
});
