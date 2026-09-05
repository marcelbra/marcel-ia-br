import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import CvSection from "./CvSection";

const logos = () => Array.from(document.querySelectorAll("pre"));
const glyphsOf = (logo: Element) =>
  Array.from(logo.querySelectorAll<HTMLElement>("[data-glyph]"));

describe("CvSection ascii logos", () => {
  it("splits each logo into one span per letter", () => {
    render(<CvSection />);
    const words = logos().map((logo) => glyphsOf(logo).map((g) => g.dataset.glyph).join(""));
    expect(words).toEqual(["KPN", "NEWTONE", "ERANEOS"]);
  });

  it("slices the art on the real glyph boundaries", () => {
    render(<CvSection />);
    const seen = new Map<string, string>();

    for (const logo of logos()) {
      const glyphs = glyphsOf(logo);
      const rowCount = glyphs[0].textContent!.split("\n").length;

      for (const glyph of glyphs) {
        const letter = glyph.dataset.glyph!;
        const block = glyph.textContent!;
        const rows = block.split("\n");

        // A misaligned width would leave rows of differing length...
        expect(rows).toHaveLength(rowCount);
        expect(new Set(rows.map((row) => row.length)).size).toBe(1);
        // ...or the same letter rendering differently in another logo.
        const previous = seen.get(letter);
        if (previous !== undefined) expect(block).toBe(previous);
        seen.set(letter, block);
      }
    }

    expect(seen.get("K")).toBe(
      ["██╗  ██╗", "██║ ██╔╝", "█████╔╝ ", "██╔═██╗ ", "██║  ██╗", "╚═╝  ╚═╝"].join("\n"),
    );
  });

  it("marks letters atomically and leaves the cursor alone", () => {
    render(<CvSection />);
    for (const logo of logos()) {
      expect(logo.className).not.toContain("cursor-pointer");
      for (const glyph of glyphsOf(logo)) {
        expect(glyph.textContent).not.toBe("");
      }
    }
  });
});
