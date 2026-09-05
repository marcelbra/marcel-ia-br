/** Terminal-style cut marker: three ASCII dots, not the "…" glyph. */
export const CLIP_MARK = "...";

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

/** `clip` applied line by line, the way a terminal cuts a block of output. */
export function clipLines(text: string, capacity: number): string {
  return text
    .split("\n")
    .map((line) => clip(line, capacity))
    .join("\n");
}
