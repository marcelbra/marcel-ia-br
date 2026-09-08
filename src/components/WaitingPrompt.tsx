/**
 * The prompt the shell drops back to once a command has printed everything it
 * had. It is what names the empty space under a short section: a terminal
 * waiting for the next command, rather than a page that ran out of content.
 *
 * The shell's own prompt, so it keeps the shell's colour at every section —
 * the coloured `$` above each card belongs to that card, this one does not.
 */
const WaitingPrompt = () => (
  <div data-testid="waiting-prompt" aria-hidden="true" className="mt-6 shrink-0 text-muted-foreground">
    <span className="text-hoodie-blue">$</span> <span className="cursor-blink" />
  </div>
);

export default WaitingPrompt;
