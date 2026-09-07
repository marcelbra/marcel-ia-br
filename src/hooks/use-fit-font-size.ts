import { useEffect, useRef, useState } from "react";

/** The size the box is measured at; the answer is scaled off it. */
const REFERENCE_PX = 10;

/**
 * The font size, in pixels, at which the returned ref's content fills the width
 * of its box — capped at `maxPx`, so the content only ever shrinks below its
 * natural size and never grows past it.
 *
 * Made for text that has to stay whole at every window size: instead of cutting
 * the tail off a line too long for the window, the line is set smaller until it
 * fits. The box is measured as itself, at a known size, rather than through a
 * stand-in string — text the page font does not carry is drawn by whatever font
 * does carry it, at that font's own widths, and only the real thing knows them.
 *
 * The box's width comes from its parent rather than from its content, so the
 * size this sets cannot feed back into the measurement, and it settles in one
 * pass.
 */
export function useFitFontSize<T extends HTMLElement>(maxPx: number) {
  const ref = useRef<T>(null);
  const [fontSize, setFontSize] = useState(maxPx);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;

    const measure = () => {
      if (!alive) return;
      const width = el.clientWidth;
      if (!width) {
        setFontSize(maxPx);
        return;
      }
      // Read back at the reference size and put the old one straight back. Both
      // happen inside the one task, so nothing is painted in between.
      const previous = el.style.fontSize;
      el.style.fontSize = `${REFERENCE_PX}px`;
      const content = el.scrollWidth;
      el.style.fontSize = previous;
      setFontSize(content > 0 ? Math.min(maxPx, (width / content) * REFERENCE_PX) : maxPx);
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
  }, [maxPx]);

  return [ref, fontSize] as const;
}
