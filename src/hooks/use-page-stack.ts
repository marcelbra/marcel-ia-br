import { useCallback, useEffect, useRef } from "react";

/**
 * How closely the stack follows the page it has been asked for, per gesture.
 * The page is chased rather than tweened: every frame closes the same share
 * of whatever is left, so a page asked for mid-travel is simply a new mark to
 * head for, and the stack bends towards it instead of restarting. Turning
 * back is the same thing in the other direction, which is what makes a change
 * of mind read as one movement rather than as a snap.
 *
 * The two gestures differ because the gestures do, not because the machines
 * do — a laptop has a trackpad and may have a touchscreen too, so the input
 * is what this reads, never the browser or the system. A swipe is a hand on
 * the page and keeps up with the finger; a wheel notch is a request, and at
 * the hand's speed the stack reads as running away from the reader.
 */
const SWIPE_TAU_MS = 55;
const WHEEL_TAU_MS = 80;
/** Close enough to the mark to sit down on it. */
const ARRIVED_PX = 0.5;
/**
 * A floor under the chase, so the last few pixels are covered rather than
 * crawled: an exponential alone spends longer on them than on the whole of
 * the rest, and the browser rounds a fraction of a pixel away to nothing.
 */
const MIN_PX_PER_FRAME = 2.5;

/**
 * How far the wheel has to travel to turn a page. Distance rather than the
 * count of events: a mouse sends one fat notch, a trackpad a stream of small
 * ones, and a page per notch would make the same push mean wildly different
 * things on the two of them.
 */
const WHEEL_STEP_PX = 60;
/** Silence that ends a gesture: after it the next event starts a fresh one. */
const GESTURE_GAP_MS = 120;
/** A line and a page, for the wheels that count in those. */
const LINE_PX = 16;
const SWIPE_MIN_PX = 30;
const SWIPE_GAP_MS = 120;
const WHEEL_GAP_MS = 150;

/** Where the page at `index` sits in the scroller, in pixels from the top. */
const topOf = (container: HTMLElement, index: number) => {
  const page = container.children[index] as HTMLElement | undefined;
  const first = container.children[0] as HTMLElement | undefined;
  return page && first ? page.offsetTop - first.offsetTop : 0;
};

/** What a wheel event means in pixels, whatever unit it counts in. */
const wheelPx = (e: WheelEvent, pageHeight: number) =>
  e.deltaMode === 1 ? e.deltaY * LINE_PX : e.deltaMode === 2 ? e.deltaY * pageHeight : e.deltaY;

/**
 * A stack of full-height pages that a wheel or a swipe turns one at a time.
 * Returns the ref for the scroller the pages are the children of.
 */
export function usePageStack<T extends HTMLElement>(count: number) {
  const containerRef = useRef<T>(null);
  const indexRef = useRef(0);
  const frameRef = useRef(0);
  const tauRef = useRef(WHEEL_TAU_MS);
  const readyAtRef = useRef(0);
  // The wheel gesture being read: when it last spoke, how hard, which way,
  // how far it has pushed since the last page, and whether it has had one.
  const lastAtRef = useRef(0);
  const lastMagnitudeRef = useRef(0);
  const directionRef = useRef(0);
  const pushedRef = useRef(0);
  const turnedRef = useRef(false);

  const chase = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    cancelAnimationFrame(frameRef.current);

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      container.scrollTop = topOf(container, indexRef.current);
      return;
    }

    // Held here rather than read back from the scroller, which rounds: a step
    // smaller than the rounding would be lost, and the chase would stall a
    // few pixels short of the mark and go on running for as long as the page
    // was open.
    let position = container.scrollTop;
    let last = performance.now();
    const tick = (now: number) => {
      const target = topOf(container, indexRef.current);
      const remaining = target - position;
      if (Math.abs(remaining) < ARRIVED_PX) {
        container.scrollTop = target;
        return;
      }
      // The same share of what is left every frame, so the speed falls away
      // with the distance and a new mark mid-flight costs no discontinuity.
      const share = Math.abs(remaining) * (1 - Math.exp(-(now - last) / tauRef.current));
      position += Math.sign(remaining) * Math.min(Math.max(share, MIN_PX_PER_FRAME), Math.abs(remaining));
      container.scrollTop = position;
      last = now;
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const goTo = useCallback((index: number, tau: number) => {
    const clamped = Math.max(0, Math.min(count - 1, index));
    if (clamped === indexRef.current) return;
    indexRef.current = clamped;
    tauRef.current = tau;
    chase();
  }, [chase, count]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      const delta = wheelPx(e, container.clientHeight);
      const magnitude = Math.abs(delta);
      if (!magnitude) return;

      const direction = Math.sign(delta);
      const quiet = now - lastAtRef.current > GESTURE_GAP_MS;
      // Nobody turns back inside one push, so the other way round is always a
      // new gesture — and one that has waited for nothing and owes nothing to
      // what came before it.
      const turnedRound = direction !== directionRef.current;
      if (quiet || turnedRound) {
        pushedRef.current = 0;
        turnedRef.current = false;
        if (turnedRound) readyAtRef.current = 0;
      }

      // A trackpad keeps sending for about a second after the fingers have
      // left, the delta decaying the whole way. Once this gesture has turned
      // a page, a stream that is dying away is that tail rather than a push,
      // and pushing again — or a wheel's notches, which never decay — reads
      // as exactly what it is.
      const dying = magnitude < lastMagnitudeRef.current;
      lastAtRef.current = now;
      lastMagnitudeRef.current = magnitude;
      directionRef.current = direction;
      if (turnedRef.current && dying) return;

      pushedRef.current += delta;
      if (Math.abs(pushedRef.current) < WHEEL_STEP_PX) return;
      if (now < readyAtRef.current) {
        // The push is not thrown away while the last page is still on its
        // way, but it does not pile up into a backlog either.
        pushedRef.current = direction * WHEEL_STEP_PX;
        return;
      }

      pushedRef.current = 0;
      turnedRef.current = true;
      readyAtRef.current = now + WHEEL_GAP_MS;
      goTo(indexRef.current + direction, WHEEL_TAU_MS);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      const now = performance.now();
      if (now < readyAtRef.current) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < SWIPE_MIN_PX) return;
      readyAtRef.current = now + SWIPE_GAP_MS;
      goTo(indexRef.current + (diff > 0 ? 1 : -1), SWIPE_TAU_MS);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goTo]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    // The stack is scrolled by pixels, so a resize leaves the current entry off
    // its mark by however much the page height changed — and the entry next to
    // it shows through the gap. Put the current page back on its mark at once:
    // a resize is the reader's own doing, and has nothing to animate about.
    const realign = () => {
      cancelAnimationFrame(frameRef.current);
      container.scrollTop = topOf(container, indexRef.current);
    };
    const observer = new ResizeObserver(realign);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return containerRef;
}
