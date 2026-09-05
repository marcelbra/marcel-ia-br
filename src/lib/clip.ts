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
 */
export function clipAscii(art: string, letterWidths: number[], capacity: number): string {
  const lines = art.split("\n");
  const width = Math.max(...lines.map((line) => line.length));
  if (capacity <= 0 || width <= capacity) return art;

  let kept = 0;
  for (const letter of letterWidths) {
    if (kept + letter + ASCII_DOTS_GAP + ASCII_DOTS_WIDTH > capacity) break;
    kept += letter;
  }
  const gap = kept > 0 ? ASCII_DOTS_GAP : 0;

  const firstDotRow = lines.length - ASCII_DOTS.length;
  return lines
    .map((line, i) => {
      const dots = ASCII_DOTS[i - firstDotRow] ?? "";
      return (line.slice(0, kept).padEnd(kept + gap) + dots).slice(0, capacity).trimEnd();
    })
    .join("\n");
}
