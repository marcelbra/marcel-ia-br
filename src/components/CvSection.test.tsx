import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CvSection from "./CvSection";
import { ASCII_DOTS } from "@/lib/clip";

const realRect = Element.prototype.getBoundingClientRect;

/** jsdom does no layout: pretend every box is `width` px on a `charWidth` grid. */
const stubLayout = (width: number, charWidth: number) => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: width });
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const w = charWidth * (this.textContent?.length ?? 0);
    return { x: 0, y: 0, top: 0, left: 0, right: w, bottom: 0, width: w, height: 0, toJSON: () => ({}) } as DOMRect;
  };
};

afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect;
  delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
});

describe("CvSection at a narrow width", () => {
  it("cuts bullet text with ascii dots instead of wrapping it onto a second line", () => {
    stubLayout(200, 5); // 40 characters fit
    const { container } = render(<CvSection />);

    const line = screen.getByTitle(/^Stack: Python \(Semantic Kernel/);
    expect(line.textContent).toHaveLength(40);
    expect(line.textContent?.endsWith("...")).toBe(true);
    // The full text stays available as the tooltip.
    expect(line.getAttribute("title")).toContain("ElevenLabs");
    expect(line.className).toContain("whitespace-nowrap");
    expect(container.querySelector(".flex-wrap")).toBeNull();
  });

  it("keeps every ascii wordmark on screen, cutting the wide ones down", () => {
    stubLayout(200, 5); // 40 characters fit
    const { container } = render(<CvSection />);

    const marks = [...container.querySelectorAll("pre")];
    expect(marks).toHaveLength(3);
    // No breakpoint may hide or swap out the wordmark.
    expect(marks.every((m) => !m.classList.contains("hidden") && !m.className.includes("md:"))).toBe(true);

    const [kpn, newtone] = marks;
    expect(kpn.textContent).not.toContain(ASCII_DOTS[1]); // 26 columns wide — it fits
    expect(newtone.textContent).toContain(ASCII_DOTS[1]); // 64 columns wide — it does not
    expect(rowsOf(newtone).every((row) => row.length <= 40)).toBe(true);
  });
});

const glyphsOf = (mark: Element) => [...mark.querySelectorAll<HTMLElement>("[data-glyph]")];

/** The art rows, stitched back together out of the per-letter blocks. */
const rowsOf = (mark: Element) => {
  const blocks = glyphsOf(mark).map((glyph) => glyph.textContent!.split("\n"));
  return blocks[0].map((_, row) => blocks.map((block) => block[row] ?? "").join(""));
};

describe("CvSection ascii wordmarks", () => {
  it("splits each mark into one element per letter", () => {
    stubLayout(1000, 5);
    const { container } = render(<CvSection />);

    const words = [...container.querySelectorAll("pre")].map((mark) =>
      glyphsOf(mark).map((glyph) => glyph.dataset.glyph).join(""),
    );
    expect(words).toEqual(["KPN", "NEWTONE", "ERANEOS"]);
  });

  it("cuts the art on the real glyph boundaries", () => {
    stubLayout(1000, 5);
    const { container } = render(<CvSection />);
    const seen = new Map<string, string>();

    for (const mark of container.querySelectorAll("pre")) {
      const rows = rowsOf(mark);
      // Every letter is a full-height block of equally long rows...
      expect(new Set(rows.map((row) => row.length)).size).toBe(1);

      for (const glyph of glyphsOf(mark)) {
        const letter = glyph.dataset.glyph!;
        const block = glyph.textContent!;
        expect(block.split("\n")).toHaveLength(rows.length);
        // ...and renders identically wherever that letter appears.
        const previous = seen.get(letter);
        if (previous !== undefined) expect(block).toBe(previous);
        seen.set(letter, block);
      }
    }

    expect(seen.get("K")).toBe(
      ["██╗  ██╗", "██║ ██╔╝", "█████╔╝ ", "██╔═██╗ ", "██║  ██╗", "╚═╝  ╚═╝"].join("\n"),
    );
  });

  it("drops whole letters as the window narrows, the ellipsis closing up behind them", () => {
    stubLayout(200, 5); // 40 characters fit
    const { container } = render(<CvSection />);
    const newtone = [...container.querySelectorAll("pre")][1];

    // N E W fill the 28 columns left beside the ellipsis; T O N E do not.
    expect(glyphsOf(newtone).map((glyph) => glyph.dataset.glyph).join("")).toBe("NEW");
    // No letter is half drawn: N and E keep their own widths, W carries the mark.
    const blocks = glyphsOf(newtone).map((glyph) => glyph.textContent!.split("\n"));
    expect(blocks.map((block) => block[0].length)).toEqual([10, 8, 10]);
    expect(blocks[2].at(-1)).toBe(" ╚══╝╚══╝  " + ASCII_DOTS[1]); // W's own baseline, then the dots
    expect(rowsOf(newtone).every((row) => row.length <= 40)).toBe(true);
  });

  it("leaves the pointer alone — the mark is not a link", () => {
    stubLayout(1000, 5);
    const { container } = render(<CvSection />);
    for (const mark of container.querySelectorAll("pre")) {
      expect(mark.className).not.toContain("cursor-pointer");
    }
  });
});

describe("CvSection at a wide width", () => {
  it("shows the wordmarks and the bullets in full", () => {
    stubLayout(1000, 5); // 200 characters fit
    const { container } = render(<CvSection />);

    expect(screen.getByText(/Lead engineer building agent eval capabilities/)).toBeInTheDocument();
    expect([...container.querySelectorAll("pre")].every((m) => !m.textContent?.includes(ASCII_DOTS[1]))).toBe(true);
    expect(container.querySelector("[title]")).toBeNull(); // nothing was cut
  });
});
