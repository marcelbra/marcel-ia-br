import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFittingList } from "@/hooks/use-fitting-list";

/** How far a swipe has to travel sideways before it counts as one. */
const SWIPE_PX = 40;
/** How long a trackpad has to fall quiet for its flick to count as over. */
const COAST_GAP_MS = 120;

/** One step of the pager: greyed out where there is nothing that way. */
const PagerArrow = ({ label, back, color, disabled, onClick }: {
  label: string;
  back?: boolean;
  color: string;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    // Padded out to something a thumb can hit, and pulled back vertically by
    // the same amount so the row costs no more height than the arrows do.
    className={`px-3 py-1.5 -my-1.5 transition-colors ${
      disabled ? "text-muted-foreground/25 cursor-default" : `${color} hover:opacity-70`
    }`}
  >
    {/* Drawn rather than typed: the arrow glyphs of the page font are hairlines
        at this size, and a control has to carry more weight than the prose it
        sits under. */}
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={back ? "M10.5 2.5L4.5 8l6 5.5" : "M5.5 2.5L11.5 8l-6 5.5"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

interface PagedBulletsProps {
  /** How many bullets the entry has in all. */
  total: number;
  /** The entry's accent, which the arrows take. */
  color: string;
  /** Classes for the list itself — the space between bullets differs by entry. */
  className?: string;
  /** Classes for one bullet's own row. */
  itemClassName?: string;
  /** The content of the bullet at `index`. */
  children: (index: number) => ReactNode;
}

/**
 * The bullets of a role or a degree, cut to what the card has room for, with a
 * pager under them for the rest. The card gives way to the window rather than
 * growing out of it: the border always closes above the bottom edge of the
 * terminal, right under the last bullet that fits, and the ones past it go
 * whole rather than being cut off mid-line.
 *
 * The pager turns pages rather than scrolling by a line: the next page starts
 * where this one ran out, so every bullet is read once, in one place, instead
 * of sliding up through the card. The arrow with nothing left that way is
 * greyed out, and where everything fits there is no pager at all.
 *
 * Where the pages fall depends on how many bullets fit, so they are worked out
 * as they are turned to and remembered — and forgotten again the moment the
 * window resizes and the answer changes.
 *
 * Away from a page of the stack there is no boundary above it. Everything fits,
 * and there is nothing to page through.
 */
const PagedBullets = ({ total, color, className = "", itemClassName = "", children }: PagedBulletsProps) => {
  // Where each page turned to so far begins. The first one begins at the top.
  const [starts, setStarts] = useState([0]);
  const [page, setPage] = useState(0);
  const from = starts[page] ?? 0;
  const [listRef, visible, listHeight] = useFittingList<HTMLUListElement>(total, from);
  const on = from + visible < total;

  // How many fit has changed, so where the pages after this one fall is not
  // known any more. Work them out again on the way forward.
  useEffect(() => {
    setStarts((current) => (current.length > page + 1 ? current.slice(0, page + 1) : current));
  }, [visible, page]);

  // How far the run has to be lifted for the page to start at the top of the
  // box. Scrolling would be the obvious way to do it, but a box that is the
  // whole room is taller than the last page's content and scrolling stops
  // short of the last page, leaving it sitting along the bottom. A margin has
  // no such limit. offsetTop is read rather than the rect: both ends move
  // together with the margin, so the distance between them does not, and the
  // measurement settles rather than chasing itself.
  const [lift, setLift] = useState(0);
  useLayoutEffect(() => {
    const list = listRef.current;
    const item = list?.children[from] as HTMLElement | undefined;
    const first = list?.children[0] as HTMLElement | undefined;
    if (item && first) setLift(item.offsetTop - first.offsetTop);
  }, [from, visible, listHeight, listRef]);

  const paged = page > 0 || on;

  const turn = useCallback(() => {
    if (!on) return;
    setStarts((current) => [...current.slice(0, page + 1), from + visible]);
    setPage(page + 1);
  }, [on, page, from, visible]);

  const back = useCallback(() => {
    setPage((current) => Math.max(0, current - 1));
  }, []);

  // The handlers are subscribed once and read the current turn through these,
  // so a page turn does not tear the listeners down and put them back up.
  const turnRef = useRef(turn);
  turnRef.current = turn;
  const backRef = useRef(back);
  backRef.current = back;

  // Pages turn sideways too: a swipe left goes on, a swipe right goes back, by
  // trackpad or by thumb. The stack these cards sit in reads the same events
  // for its own up-and-down, so a gesture that is more sideways than not is
  // taken here and stopped, and everything else is left alone to reach it.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !paged) return;

    // A trackpad sends one flick as a stream of deltas and keeps sending them
    // as it coasts to a stop. They are added up until they amount to a swipe,
    // and the rest of the flick is then ignored — but the flick is over when
    // the deltas stop coming, not after some length of time. Timed instead,
    // the window is either short enough to let a long coast turn a second page
    // or long enough to swallow a second flick meant on purpose.
    let travelled = 0;
    let coasting = false;
    let quiet: ReturnType<typeof setTimeout>;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(quiet);
      quiet = setTimeout(() => { coasting = false; travelled = 0; }, COAST_GAP_MS);
      if (coasting) return;
      travelled += e.deltaX;
      if (Math.abs(travelled) < SWIPE_PX) return;
      const forward = travelled > 0;
      travelled = 0;
      coasting = true;
      (forward ? turnRef : backRef).current();
    };

    let startX = 0;
    let startY = 0;
    const touchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const touchEnd = (e: TouchEvent) => {
      const dx = startX - e.changedTouches[0].clientX;
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < SWIPE_PX) return;
      e.stopPropagation();
      (dx > 0 ? turnRef : backRef).current();
    };

    list.addEventListener("wheel", wheel, { passive: false });
    list.addEventListener("touchstart", touchStart, { passive: true });
    list.addEventListener("touchend", touchEnd, { passive: true });
    return () => {
      clearTimeout(quiet);
      list.removeEventListener("wheel", wheel);
      list.removeEventListener("touchstart", touchStart);
      list.removeEventListener("touchend", touchEnd);
    };
  }, [paged, listRef]);

  return (
    <>
      <ul
        ref={listRef}
        style={{ height: listHeight, touchAction: paged ? "pan-y" : undefined }}
        className={`min-h-0 overflow-hidden ${className}`}
      >
        {Array.from({ length: total }, (_, j) => (
          <li
            key={j}
            style={j === 0 ? { marginTop: -lift } : undefined}
            className={`${itemClassName} ${j >= from && j < from + visible ? "" : "invisible"}`}
          >
            {children(j)}
          </li>
        ))}
      </ul>
      {paged && (
        <div className="shrink-0 self-center flex items-center gap-2 pt-3">
          <PagerArrow label="Previous bullets" back color={color} disabled={page === 0} onClick={back} />
          <PagerArrow label="Next bullets" color={color} disabled={!on} onClick={turn} />
        </div>
      )}
    </>
  );
};

export default PagedBullets;
