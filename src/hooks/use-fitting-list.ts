import { useEffect, useRef, useState } from "react";

/** Marks the box a fitted list is not allowed to grow out of. */
export const FIT_BOUNDARY = "data-fit-boundary";

interface Fit {
  /** How many items, counting from the first one shown, the boundary has room for. */
  count: number;
  /** The height that leaves exactly those showing, or undefined while all fit. */
  height?: number;
}

/**
 * Fit a list into the box marked with {@link FIT_BOUNDARY} above it: how many
 * of its items there is room for, counting from `from`, and the height that
 * shows those and no more. Items outside that run are the ones the box has no
 * room for — hide them with `visibility`, not `display`, and let the height
 * clip them away. Scroll the box to the item at `from` to bring the run into
 * view; `scrollTop` moves nothing in the layout, so it cannot disturb this.
 *
 * Keeping every item in the layout is what keeps the answer stable. What would
 * fit is measurable at every size; the room it is measured against is read as
 * the boundary's height less everything beside the list, which is the same
 * number before and after the list is cut down, and the same at every `from`.
 * So the count settles in one pass instead of chasing itself as items go and
 * come back.
 *
 * Everything is kept while there is nothing to measure (no layout yet, jsdom),
 * so a list is never cut on a guess.
 */
export function useFittingList<T extends HTMLElement>(total: number, from = 0) {
  const ref = useRef<T>(null);
  const [fit, setFit] = useState<Fit>({ count: total });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;

    const measure = () => {
      if (!alive) return;
      const boundary = el.closest<HTMLElement>(`[${FIT_BOUNDARY}]`);
      const items = Array.from(el.children);
      if (!boundary?.clientHeight || !items.length) {
        setFit((current) => (current.count === total && current.height === undefined ? current : { count: total }));
        return;
      }

      // Everything from the boundary down to the list shares the boundary's
      // height with it, and none of it moves when the list is cut down.
      let block: HTMLElement = el;
      while (block.parentElement && block.parentElement !== boundary) block = block.parentElement;
      const style = getComputedStyle(boundary);
      const pad = (side: string) => parseFloat(side) || 0;
      const inside = boundary.clientHeight - pad(style.paddingTop) - pad(style.paddingBottom);
      const room = inside - (block.getBoundingClientRect().height - el.getBoundingClientRect().height);

      const start = Math.min(from, items.length - 1);
      const top = items[start].getBoundingClientRect().top;
      let count = 0;
      let height = 0;
      for (const item of items.slice(start)) {
        // Half a pixel of slack: a fractional layout must not cost a whole line.
        const bottom = item.getBoundingClientRect().bottom - top;
        if (bottom > room + 0.5) break;
        count += 1;
        height = bottom;
      }

      // Only a list showing all of itself from the top may keep its own height.
      const whole = start === 0 && count === items.length;
      const next: Fit = whole ? { count } : { count, height };
      setFit((current) => (current.count === next.count && current.height === next.height ? current : next));
    };

    measure();
    document.fonts?.ready.then(measure).catch(() => {});

    if (typeof ResizeObserver === "undefined") return () => { alive = false; };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(el.closest(`[${FIT_BOUNDARY}]`) ?? el);
    // The items reflow on their own as the window narrows, without the list
    // around them changing size at all.
    for (const item of el.children) observer.observe(item);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [total, from]);

  return [ref, fit.count, fit.height] as const;
}
