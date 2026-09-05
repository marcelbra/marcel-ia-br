/** Terminal-style cut marker for a line of text: three ASCII dots. */
export const CLIP_MARK = "...";

/**
 * The wordmark font's own ellipsis: three big dots sitting on the baseline,
 * drawn in the same block style as the letters they follow.
 */
export const ASCII_DOTS = ["██╗ ██╗ ██╗", "╚═╝ ╚═╝ ╚═╝"];
const ASCII_DOTS_WIDTH = 11;
const ASCII_DOTS_GAP = 1;

/**
 * Cut `text` down to at most `capacity` characters, marking the cut with
 * `CLIP_MARK`. A capacity of 0 or less means "not measured yet" and leaves the
 * text untouched, so text is never clipped on a guess.
 */
export function clip(text: string, capacity: number): string {
  if (capacity <= 0 || text.length <= capacity) return text;
  if (capacity <= CLIP_MARK.length) return CLIP_MARK.slice(0, capacity);
  return text.slice(0, capacity - CLIP_MARK.length) + CLIP_MARK;
}

/**
 * Cut a wordmark down to `capacity` columns. Letters go whole or not at all —
 * NEWTONE loses its E, then its W, never half a glyph — and the block-style
 * ellipsis follows straight after the last letter left standing, so the dots
 * sit where the letter that just went used to be.
 *
 * `letterWidths` is the column width of each letter of `art`, left to right.
 * Returns the art one block per letter, the last block carrying the ellipsis,
 * so a caller can keep the letters apart as separate elements.
 */
export function clipAscii(art: string, letterWidths: number[], capacity: number): string[] {
  const lines = art.split("\n");
  const width = Math.max(...lines.map((line) => line.length));
  const padded = lines.map((line) => line.padEnd(width));
  const cut = capacity > 0 && width > capacity;

  let letters = letterWidths.length;
  if (cut) {
    let used = 0;
    letters = 0;
    for (const letter of letterWidths) {
      if (used + letter + ASCII_DOTS_GAP + ASCII_DOTS_WIDTH > capacity) break;
      used += letter;
      letters += 1;
    }
  }

  const blocks: string[] = [];
  let column = 0;
  for (const letter of letterWidths.slice(0, letters)) {
    blocks.push(padded.map((line) => line.slice(column, column + letter)).join("\n"));
    column += letter;
  }
  if (!cut) return blocks;

  const firstDotRow = lines.length - ASCII_DOTS.length;
  const withDots = (block: string, gap: number) =>
    block
      .split("\n")
      .map((line, i) => {
        const dots = ASCII_DOTS[i - firstDotRow];
        return dots ? line + " ".repeat(gap) + dots : line;
      })
      .join("\n");

  // Not even the first letter fits: the mark is nothing but its own ellipsis.
  if (blocks.length === 0) {
    const bare = withDots(lines.map(() => "").join("\n"), 0);
    return [bare.split("\n").map((line) => line.slice(0, capacity)).join("\n")];
  }
  return [...blocks.slice(0, -1), withDots(blocks[blocks.length - 1], ASCII_DOTS_GAP)];
}
