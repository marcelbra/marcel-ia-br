import { CSSProperties, useEffect, useRef, useState } from "react";
import { FIT_BOUNDARY } from "./use-fitting-list";

/** What the hero is showing of itself, once the room has been counted. */
interface HeroFit {
  /** Whether the avatar's slot is affordable. */
  avatar: boolean;
  /** Lines of the bio there is room for, or undefined while all of them fit. */
  lines?: number;
}

/** The elements the fit is measured from, in the order they give way. */
export interface HeroParts {
  /** The hero's own block: everything the boundary has to hold. */
  block: HTMLElement | null;
  /** The row the banner and the avatar share. */
  row: HTMLElement | null;
  /** The banner, which is what the row is left with once the avatar goes. */
  banner: HTMLElement | null;
  /** The bio, the one part here that can be read short. */
  bio: HTMLElement | null;
}

const ALL: HeroFit = { avatar: true };

/**
 * Fit the hero into the box marked with {@link FIT_BOUNDARY} above it. Two
 * things give way, in the order a reader would want them to: the avatar, which
 * is 160px of decoration, and then the bio, a line at a time — so that the
 * links under it, the only thing here anyone has to reach, stay on the screen
 * instead of the terminal having something to scroll.
 *
 * Everything the answer is counted from stays still while it is being acted on:
 * the room the boundary leaves, the height of the parts that never give way,
 * the slot the avatar costs — remembered from the passes where the hero is
 * paying it, since a closed slot cannot be measured — and the bio's full
 * length, which stays readable as its scroll height however few of its lines
 * are shown. So the fit settles in one pass instead of chasing itself as the
 * two come and go.
 *
 * Everything is kept while there is nothing to measure (no layout yet, jsdom),
 * so the hero is never cut on a guess.
 */
export function useFittingHero(parts: () => HeroParts) {
  const [fit, setFit] = useState<HeroFit>(ALL);
  const read = useRef(parts);
  read.current = parts;
  // What the hero is paying right now, to tell that apart from what it would
  // pay. The state itself is a render behind inside the measuring pass.
  const paying = useRef(fit);
  paying.current = fit;
  // What the row carries for the avatar over the banner's own height. Read
  // whenever the hero is paying it and kept for the passes where it is not:
  // the row is held open by a minimum height rather than by the avatar's own
  // box — which the avatar hangs below, by a margin — so the avatar cannot be
  // measured for it, and a closed row has nothing left to measure.
  const slot = useRef(0);

  useEffect(() => {
    let alive = true;

    const measure = () => {
      if (!alive) return;
      const { block, row, banner, bio } = read.current();
      const boundary = block?.closest<HTMLElement>(`[${FIT_BOUNDARY}]`);
      const lineHeight = bio ? parseFloat(getComputedStyle(bio).lineHeight) : 0;
      if (!block || !row || !banner || !bio || !boundary?.clientHeight || !lineHeight) {
        setFit((current) => (current.avatar && current.lines === undefined ? current : ALL));
        return;
      }

      const height = (el: Element) => el.getBoundingClientRect().height;
      // Everything from the boundary down to the hero shares the boundary's
      // height with it, and none of it moves when the hero gives way.
      let outer: HTMLElement = block;
      while (outer.parentElement && outer.parentElement !== boundary) outer = outer.parentElement;
      const style = getComputedStyle(boundary);
      const pad = (side: string) => parseFloat(side) || 0;
      const inside = boundary.clientHeight - pad(style.paddingTop) - pad(style.paddingBottom);
      const room = inside - (height(outer) - height(block));

      if (paying.current.avatar) slot.current = Math.max(0, height(row) - height(banner));
      // The parts that never give way: the hero less the two that do.
      const rest = height(block) - height(bio) - (paying.current.avatar ? slot.current : 0);
      const whole = bio.scrollHeight;
      const total = Math.round(whole / lineHeight);

      // Half a pixel of slack: a fractional layout must not cost a whole line,
      // nor the avatar its place.
      const keepAvatar = rest + slot.current + whole <= room + 0.5;
      const spare = room - rest - (keepAvatar ? slot.current : 0);
      const fits = Math.max(0, Math.min(total, Math.floor((spare + 0.5) / lineHeight)));
      const next: HeroFit = { avatar: keepAvatar, lines: fits >= total ? undefined : fits };
      paying.current = next;
      setFit((current) => (current.avatar === next.avatar && current.lines === next.lines ? current : next));
    };

    measure();
    // JetBrains Mono lands after first paint and wraps to different lines.
    document.fonts?.ready.then(measure).catch(() => {});

    if (typeof ResizeObserver === "undefined") return () => { alive = false; };
    const observer = new ResizeObserver(measure);
    const { block, bio } = read.current();
    if (block) observer.observe(block);
    if (bio) observer.observe(bio);
    const boundary = block?.closest(`[${FIT_BOUNDARY}]`);
    if (boundary) observer.observe(boundary);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);

  return fit;
}

/**
 * The style that shows `lines` of a block and no more. A block with room for no
 * line at all is closed rather than clamped: `line-clamp` counts from one, and
 * there is no ellipsis worth the line it would cost. Either way the text stays
 * in the layout, so its full length is still there to measure.
 */
export function clampToLines(lines: number | undefined): CSSProperties | undefined {
  if (lines === undefined) return undefined;
  if (lines === 0) return { height: 0, overflow: "hidden" };
  return { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" };
}

/**
 * The style that takes the avatar out of the flow without taking it out of the
 * layout, so the row closes over it and its height is still there to measure on
 * the pass that decides whether to let it back in.
 */
export function hideAvatar(shown: boolean): CSSProperties | undefined {
  return shown ? undefined : { position: "absolute", visibility: "hidden" };
}
