import { ReactNode } from "react";

interface EntryHeadingProps {
  /** The role or degree. The only part of the heading that may break. */
  title: string;
  /** The company or institution, shown after an @. */
  at: string;
  /** The entry's accent, applied to the @ and what follows it. */
  color: string;
  /** The period, or periods — laid out by the caller, kept whole by this. */
  children: ReactNode;
  className?: string;
}

/**
 * The heading a role or a degree opens with: what it was, where, and when.
 *
 * Those are three things, and as the window narrows they come apart in that
 * order, one whole thing at a time. Wide, all three share a line. Take the
 * room for the period away and the period alone drops below. Take the room
 * for the company away and the company follows it down, carrying its @ with
 * it, and the period drops again to a third line. Only when the title itself
 * no longer fits does anything break mid-phrase, and then it is the title —
 * `Machine Learning` above `Engineer`, never `Royal` above `KPN N.V.`
 *
 * Two nested wrapping rows are what order it: the outer one holds the title
 * row and the period, the inner one holds the title and the company. Flex
 * wraps an item to the next line before it will squeeze it, so each row gives
 * up its last item first and only breaks its text once a line holds nothing
 * else — which is the cascade, without a breakpoint anywhere in it.
 */
const EntryHeading = ({ title, at, color, children, className = "" }: EntryHeadingProps) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-4 flat:mb-2 shrink-0">
    {/* The gap stands in for the space that used to sit between them, which a
        flex row would otherwise collapse. In em, so it tracks the type. */}
    <h3 className={`text-foreground font-medium flex flex-wrap items-baseline gap-x-[0.6em] ${className}`}>
      <span>{title}</span>
      <span className={color}>@ {at}</span>
    </h3>
    {children}
  </div>
);

export default EntryHeading;
