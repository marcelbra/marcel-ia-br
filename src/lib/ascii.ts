/**
 * Split a wordmark into one block per letter, left to right. `letterWidths` is
 * the column width of each letter of `art`.
 *
 * The art is six rows of box drawing characters, so a letter only exists as a
 * vertical slice through all of them. Handing the caller those slices lets it
 * give every letter its own element — which is what makes the mark selectable
 * and copyable as the word it spells rather than as the art that draws it.
 */
export function splitLetters(art: string, letterWidths: number[]): string[] {
  const lines = art.split("\n");
  const width = Math.max(...lines.map((line) => line.length));
  const padded = lines.map((line) => line.padEnd(width));

  const blocks: string[] = [];
  let column = 0;
  for (const letter of letterWidths) {
    blocks.push(padded.map((line) => line.slice(column, column + letter)).join("\n"));
    column += letter;
  }
  return blocks;
}
