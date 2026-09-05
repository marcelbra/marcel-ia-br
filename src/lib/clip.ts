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
 * Cut a block of ASCII art to `capacity` columns. The cut is marked once, by
 * the block-style ellipsis on the baseline — not by a row of dots on every
 * line, which would read as six separate cuts instead of one wordmark that
 * carries on past the edge.
 */
export function clipAscii(art: string, capacity: number): string {
  const lines = art.split("\n");
  if (capacity <= 0 || lines.every((line) => line.length <= capacity)) return art;

  const keep = Math.max(0, capacity - ASCII_DOTS_WIDTH - ASCII_DOTS_GAP);
  const firstDotRow = lines.length - ASCII_DOTS.length;
  return lines
    .map((line, i) => {
      const dots = ASCII_DOTS[i - firstDotRow] ?? "";
      return (line.slice(0, keep).padEnd(keep + ASCII_DOTS_GAP) + dots).slice(0, capacity).trimEnd();
    })
    .join("\n");
}
