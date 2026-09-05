import { useEffect, useRef, useState } from "react";

const PROBE = "0".repeat(100);

/**
 * How many monospace characters fit on one line of the returned ref's content
 * box. The site is monospace throughout, so a character count is an exact
 * stand-in for a width measurement — and it survives resizes without the text
 * ever reflowing onto a second line.
 *
 * A capacity of 0 means "not measurable" (no layout yet, jsdom, fonts still
 * loading); callers render their text unclipped in that case.
 */
export function useCharCapacity<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [capacity, setCapacity] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;

    const measure = () => {
      if (!alive) return;
      const width = el.clientWidth;
      if (!width) {
        setCapacity(0);
        return;
      }
      // Measure in place so the probe inherits font size and letter spacing.
      const probe = document.createElement("span");
      probe.textContent = PROBE;
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;";
      el.appendChild(probe);
      const charWidth = probe.getBoundingClientRect().width / PROBE.length;
      probe.remove();
      setCapacity(charWidth > 0 ? Math.floor(width / charWidth) : 0);
    };

    measure();
    // JetBrains Mono lands after first paint and is wider than the fallback.
    document.fonts?.ready.then(measure).catch(() => {});

    if (typeof ResizeObserver === "undefined") return () => { alive = false; };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);

  return [ref, capacity] as const;
}
