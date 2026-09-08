import { useCallback, useEffect, useRef } from "react";

/**
 * How fast a page travels, and how soon the next one may start, per gesture.
 * The page is moved by hand rather than through scrollIntoView({ behavior:
 * "smooth" }), whose duration belongs to the browser and runs longer than
 * either of these.
 *
 * The two differ because the gestures do, not because the machines do — a
 * laptop has a trackpad and may have a touchscreen too, so the input is what
 * this reads, never the browser or the system.
 *
 * A swipe is a hand on the page: it should keep up with the finger, and the
 * next swipe can start before the last has landed, which is what makes a
 * flick through the stack feel continuous. A wheel notch is a request rather
 * than a hand — at swipe speed the stack reads as running away from the
 * reader — so its page travels slower.
 *
 * How fast a page moves and how fast pages may follow one another are not the
 * same thing, though, and only the first is about the reading. Waiting for the
 * page to land before taking the next notch made the calm travel cost the
 * reader the ability to get anywhere quickly; a notch part-way through simply
 * retargets the travel from where the page has got to, and a spin then reads
 * as one continuous move across several pages at the same unhurried speed.
 */
const SWIPE = { travel: 180, gap: 120 };
const WHEEL = { travel: 320, gap: 150 };
const WHEEL_MIN = 5;
const SWIPE_MIN = 30;
/**
 * A trackpad keeps sending for up to a second after the fingers have left,
 * the delta decaying the whole way, and that tail must not turn one flick
 * into four pages. A quiet moment ends the burst; until then only a push back
 * at something like full strength counts as a new one — which is what a
 * second flick is, and what the even notches of a mouse wheel always are.
 */
const BURST_GAP_MS = 90;
const BURST_TAIL = 0.85;

/** Where the page at `index` sits in the scroller, in pixels from the top. */
const topOf = (container: HTMLElement, index: number) => {
  const page = container.children[index] as HTMLElement | undefined;
  const first = container.children[0] as HTMLElement | undefined;
  return page && first ? page.offsetTop - first.offsetTop : 0;
};

/**
 * A stack of full-height pages that a wheel or a swipe turns one at a time.
 * Returns the ref for the scroller the pages are the children of.
 */
export function usePageStack<T extends HTMLElement>(count: number) {
  const containerRef = useRef<T>(null);
  const indexRef = useRef(0);
  const frameRef = useRef(0);
  const readyAtRef = useRef(0);
  const lastAtRef = useRef(0);
  const peakRef = useRef(0);

  const scrollToIndex = useCallback((index: number, travel: number) => {
    const container = containerRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(count - 1, index));
    if (clamped === indexRef.current) return;
    indexRef.current = clamped;

    const from = container.scrollTop;
    const distance = topOf(container, clamped) - from;
    cancelAnimationFrame(frameRef.current);
    if (!distance) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      container.scrollTop = from + distance;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / travel);
      // Out-cubic: away from the mark at once, and settling rather than braking.
      container.scrollTop = from + distance * (1 - (1 - t) ** 3);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [count]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const take = (direction: number, now: number, pace: { travel: number; gap: number }) => {
      readyAtRef.current = now + pace.gap;
      scrollToIndex(indexRef.current + direction, pace.travel);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      const magnitude = Math.abs(e.deltaY);
      const fresh = now - lastAtRef.current > BURST_GAP_MS;
      lastAtRef.current = now;
      peakRef.current = fresh ? magnitude : Math.max(peakRef.current, magnitude);

      if (magnitude < WHEEL_MIN) return;
      if (now < readyAtRef.current) return;
      if (!fresh && magnitude < peakRef.current * BURST_TAIL) return;
      take(e.deltaY > 0 ? 1 : -1, now, WHEEL);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      const now = performance.now();
      if (now < readyAtRef.current) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < SWIPE_MIN) return;
      take(diff > 0 ? 1 : -1, now, SWIPE);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollToIndex]);

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
