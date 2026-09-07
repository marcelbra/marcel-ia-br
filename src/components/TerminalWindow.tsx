import { ReactNode, useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const ClosedMessage = () => {
  const [bright, setBright] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setBright(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <span className={`font-mono text-lg tracking-wide transition-colors duration-700 ${bright ? 'text-muted-foreground/80' : 'text-muted-foreground/30'}`}>
      F5 / ⌘ + R
    </span>
  );
};

interface TerminalWindowProps {
  title?: string;
  children: ReactNode;
  onMinimize?: () => void;
  onFullscreen?: () => void;
  onClose?: () => void;
  onBooted?: () => void;
  disableFullscreen?: boolean;
}

const STORAGE_KEY = "terminal-offset";
const SIZE_KEY = "terminal-size";
const ZOOM_KEY = "terminal-zoom";
const CLOSED_KEY = "terminal-closed";
// How far the pointer has to travel before a press counts as a drag. Without it
// the hand tremor during a double-click tugs the window a couple of pixels, and
// the zoom that follows pulls it back — which reads as a wobble.
const DRAG_SLOP = 4;
const MIN_W = 320;
const MIN_H = 160;
// AppKit animates a window's geometry over NSWindowResizeTime — 0.2s per 150px
// of change (NSWindow.animationResizeTime:) — so a small hop is quick and a big
// one takes its time. Same rule here, capped so a full zoom does not drag on a
// web page: the zoom this page performs works out at 512ms unclamped.
const ZOOM_MS_PER_PX = 0.2 / 150 * 1000;
const ZOOM_MS_MIN = 160;
const ZOOM_MS_MAX = 450;
// NSAnimationEaseInOut is symmetric; Tailwind's own ease-in-out is not, so the
// curve is set alongside the duration rather than left to a utility class.
const EASE = "cubic-bezier(0.42, 0, 0.58, 1)";

type Offset = { x: number; y: number };
type Size = { w: number; h: number };
/** The geometry a zoomed window returns to on the second double-click. */
type Geometry = { offset: Offset; size: Size | null };

type Direction = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLES: { dir: Direction; className: string }[] = [
  { dir: "n", className: "top-0 left-0 right-0 h-1.5 cursor-ns-resize" },
  { dir: "s", className: "bottom-0 left-0 right-0 h-1.5 cursor-ns-resize" },
  { dir: "w", className: "top-0 bottom-0 left-0 w-1.5 cursor-ew-resize" },
  { dir: "e", className: "top-0 bottom-0 right-0 w-1.5 cursor-ew-resize" },
  { dir: "nw", className: "top-0 left-0 w-3 h-3 cursor-nwse-resize z-10" },
  { dir: "ne", className: "top-0 right-0 w-3 h-3 cursor-nesw-resize z-10" },
  { dir: "sw", className: "bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-10" },
  { dir: "se", className: "bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-10" },
];

const readJSON = <T,>(key: string): T | null => {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) return JSON.parse(saved) as T;
  } catch {
    // sessionStorage unavailable or holds malformed JSON; fall back to the default
  }
  return null;
};

const writeJSON = (key: string, value: unknown) => {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage unavailable; the geometry just won't survive a reload
  }
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/** How long the window should take to travel between two boxes. */
const zoomMs = (from: DOMRect, to: { left: number; top: number; w: number; h: number }) => {
  const travel = Math.max(
    Math.abs(to.left - from.left),
    Math.abs(to.top - from.top),
    Math.abs(to.w - from.width),
    Math.abs(to.h - from.height),
  );
  return Math.round(clamp(travel * ZOOM_MS_PER_PX, ZOOM_MS_MIN, ZOOM_MS_MAX));
};

/**
 * The area the window lives in: the full width of the viewport, between the
 * fixed header and the footer. Moving, resizing and zooming all stop here, so
 * the window can never cover the page chrome or slip off screen.
 */
const bounds = () => {
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  return {
    left: 0,
    right: window.innerWidth,
    top: header ? header.getBoundingClientRect().bottom : 0,
    bottom: footer ? footer.getBoundingClientRect().top : window.innerHeight,
  };
};

const TerminalWindow = ({ title = "~/marcel — zsh — 122×37", children, onMinimize, onFullscreen, onClose, onBooted, disableFullscreen }: TerminalWindowProps) => {
  const wasClosed = sessionStorage.getItem(CLOSED_KEY) === "true";
  const [closed, setClosed] = useState(false);
  const [booting, setBooting] = useState(wasClosed);
  const [bootPhase, setBootPhase] = useState<'spinning' | 'almost'>('spinning');
  const [spinFrame, setSpinFrame] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [offset, setOffset] = useState<Offset>(() => (wasClosed ? { x: 0, y: 0 } : readJSON<Offset>(STORAGE_KEY) ?? { x: 0, y: 0 }));
  const [size, setSize] = useState<Size | null>(() => (wasClosed ? null : readJSON<Size>(SIZE_KEY)));
  // Non-null exactly while the window is zoomed; it holds the geometry to go back to.
  const [restore, setRestore] = useState<Geometry | null>(() => (wasClosed ? null : readJSON<Geometry>(ZOOM_KEY)));
  // Milliseconds while a zoom is running, 0 the rest of the time — the window has
  // to follow the pointer exactly during a drag or a resize.
  const [animMs, setAnimMs] = useState(0);
  // A press that has not yet travelled far enough to be a drag. Nothing happens
  // — no move, no resize, no interrupting a running zoom — until it has.
  const pendingRef = useRef<{ dir: Direction | null; startX: number; startY: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; rangeX: [number, number]; rangeY: [number, number] } | null>(null);
  const resizeRef = useRef<{ dir: Direction; startX: number; startY: number; baseLeft: number; baseTop: number; left: number; top: number; right: number; bottom: number; anchorBottom: boolean; gap: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout>>();
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const zoomed = restore !== null;
  const zoomedRef = useRef(zoomed);
  zoomedRef.current = zoomed;
  const animMsRef = useRef(animMs);
  animMsRef.current = animMs;
  // Set once the window has been moved, resized or zoomed by hand: until then it
  // keeps following the layout when the viewport changes.
  const touchedRef = useRef(false);

  // On mount: if was closed, clear flag, reset position, show loader for 1s
  useEffect(() => {
    if (wasClosed) {
      sessionStorage.removeItem(CLOSED_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SIZE_KEY);
      sessionStorage.removeItem(ZOOM_KEY);
      setBootPhase('spinning');
      const phaseTimer = setTimeout(() => setBootPhase('almost'), 1500);
      const timer = setTimeout(() => { setBooting(false); onBooted?.(); }, 3000);
      return () => { clearTimeout(timer); clearTimeout(phaseTimer); };
    }
  }, []);

  // Spinner animation
  useEffect(() => {
    if (!booting) return;
    const interval = setInterval(() => setSpinFrame((f) => (f + 1) % 360), 24);
    return () => clearInterval(interval);
  }, [booting]);

  useEffect(() => () => clearTimeout(animTimer.current), []);

  const startAnim = (ms: number) => {
    setAnimMs(ms);
    clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => setAnimMs(0), ms + 20);
  };

  const handleClose = () => {
    setClosed(true);
    sessionStorage.setItem(CLOSED_KEY, "true");
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SIZE_KEY);
    sessionStorage.removeItem(ZOOM_KEY);
    onClose?.();
  };

  /**
   * Where the window sits before the offset is applied. Read from the slot it
   * sits in, which no transform of ours touches — deriving it from the window's
   * own box would be wrong mid-animation, when that box is still travelling.
   */
  const origin = (rect: DOMRect) => {
    const parent = containerRef.current?.parentElement;
    if (parent) {
      const p = parent.getBoundingClientRect();
      return { left: p.left, top: p.top };
    }
    return { left: rect.left - offsetRef.current.x, top: rect.top - offsetRef.current.y };
  };

  /** Stop a running zoom where it visually is, rather than at its target. */
  const settle = (rect: DOMRect, base: { left: number; top: number }) => {
    if (!animMsRef.current) return;
    setOffset({ x: rect.left - base.left, y: rect.top - base.top });
    setSize({ w: rect.width, h: rect.height });
    setAnimMs(0);
  };

  /** Stretch the window across the whole area between header and footer. */
  const fillBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const base = origin(el.getBoundingClientRect());
    const b = bounds();
    setOffset({ x: b.left - base.left, y: b.top - base.top });
    setSize({ w: b.right - b.left, h: b.bottom - b.top });
  }, []);

  /** The box the window occupies when it is left alone: the slot it sits in. */
  const resetToNatural = useCallback(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    setOffset({ x: 0, y: 0 });
    setSize({ w: parent.clientWidth, h: parent.clientHeight });
  }, []);

  /** Pull a hand-sized window back inside the bounds after the viewport changed. */
  const fitInBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el || !sizeRef.current) return;
    const rect = el.getBoundingClientRect();
    const base = origin(rect);
    const b = bounds();
    const w = Math.min(sizeRef.current.w, b.right - b.left);
    const h = Math.min(sizeRef.current.h, b.bottom - b.top);
    setOffset({ x: clamp(rect.left, b.left, b.right - w) - base.left, y: clamp(rect.top, b.top, b.bottom - h) - base.top });
    setSize({ w, h });
  }, []);

  // A width of `auto` cannot be interpolated, so the window would jump to its
  // zoomed width in one frame while the rest of the geometry animated. Measuring
  // the natural box once gives every later change two concrete lengths to move
  // between, and the whole window then grows in every direction at once.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!sizeRef.current) {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      setSize(sizeRef.current);
    }
    if (zoomedRef.current) fillBounds(); else fitInBounds();
  }, [booting, fillBounds, fitInBounds]);

  /**
   * Hold the content against the edge that is not being dragged. Pulling the
   * bottom edge up leaves the top where it is, so the content stays at the top
   * and loses its tail — the browser does that by itself. Pulling the top edge
   * down has to be the mirror image, and that takes a scroll: the box slides
   * down over content that would otherwise stay where it was, dropping the last
   * lines out of the bottom. Scrolling by what the box just lost keeps the end
   * of the content in view and takes the cut off the top instead.
   */
  useLayoutEffect(() => {
    const r = resizeRef.current;
    const body = bodyRef.current;
    if (!r || !body) return;
    const max = Math.max(0, body.scrollHeight - body.clientHeight);
    body.scrollTop = clamp(r.anchorBottom ? max - r.gap : r.gap, 0, max);
  }, [size]);

  // The bounds move with the viewport, so the window has to follow them.
  useEffect(() => {
    const follow = () => {
      if (zoomedRef.current) fillBounds();
      else if (touchedRef.current) fitInBounds();
      else resetToNatural();
    };
    window.addEventListener("resize", follow);
    return () => window.removeEventListener("resize", follow);
  }, [fillBounds, fitInBounds, resetToNatural]);

  const toggleZoom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    touchedRef.current = true;
    const rect = el.getBoundingClientRect();
    const base = origin(rect);

    if (restore) {
      startAnim(zoomMs(rect, {
        left: base.left + restore.offset.x,
        top: base.top + restore.offset.y,
        w: restore.size?.w ?? rect.width,
        h: restore.size?.h ?? rect.height,
      }));
      setOffset(restore.offset);
      setSize(restore.size);
      setRestore(null);
      return;
    }

    const b = bounds();
    startAnim(zoomMs(rect, { left: b.left, top: b.top, w: b.right - b.left, h: b.bottom - b.top }));
    setRestore({ offset, size });
    fillBounds();
  }, [restore, offset, size, fillBounds]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group\\/btns')) return;
    toggleZoom();
  }, [toggleZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomed) return;
    // The second press of a double-click is never the start of a drag.
    if (e.detail > 1) return;
    if ((e.target as HTMLElement).closest('.group\\/btns')) return;
    pendingRef.current = { dir: null, startX: e.clientX, startY: e.clientY };
    e.preventDefault();
  }, [zoomed]);

  const handleResizeDown = useCallback((dir: Direction) => (e: React.MouseEvent) => {
    pendingRef.current = { dir, startX: e.clientX, startY: e.clientY };
    e.preventDefault();
  }, []);

  /**
   * Turn a press that has travelled far enough into the gesture it was after.
   * Both the window and the pointer are read here rather than at mousedown, so
   * a gesture that starts during a zoom picks up where the window actually is
   * and keeps the grab under the cursor.
   */
  const beginGesture = (dir: Direction | null, startX: number, startY: number) => {
    const el = containerRef.current;
    if (!el) return;
    touchedRef.current = true;
    const rect = el.getBoundingClientRect();
    const base = origin(rect);
    settle(rect, base);

    if (dir) {
      // Which edge stays put decides which end of the content stays put with
      // it, and how far the content already sits from that end is what the
      // resize has to preserve.
      const body = bodyRef.current;
      const anchorBottom = dir.includes("n");
      resizeRef.current = {
        dir,
        startX,
        startY,
        baseLeft: base.left,
        baseTop: base.top,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        anchorBottom,
        gap: !body ? 0 : anchorBottom ? Math.max(0, body.scrollHeight - body.clientHeight - body.scrollTop) : body.scrollTop,
      };
      // Resizing a zoomed window means it is no longer zoomed — it keeps the
      // size it is given, and the next double-click fills the bounds again.
      setRestore(null);
      return;
    }

    const b = bounds();
    dragRef.current = {
      startX,
      startY,
      origX: rect.left - base.left,
      origY: rect.top - base.top,
      rangeX: [b.left - base.left, b.right - rect.width - base.left],
      rangeY: [b.top - base.top, b.bottom - rect.height - base.top],
    };
  };
  // The pointer listeners are registered once; this keeps them calling the
  // current closure rather than the one from the first render.
  const beginRef = useRef(beginGesture);
  beginRef.current = beginGesture;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const p = pendingRef.current;
      if (p) {
        if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < DRAG_SLOP) return;
        pendingRef.current = null;
        beginRef.current(p.dir, e.clientX, e.clientY);
      }
      const r = resizeRef.current;
      if (r) {
        const dx = e.clientX - r.startX;
        const dy = e.clientY - r.startY;
        let { left, top, right, bottom } = r;
        const b = bounds();
        if (r.dir.includes("e")) right = clamp(r.right + dx, left + MIN_W, b.right);
        if (r.dir.includes("w")) left = clamp(r.left + dx, b.left, right - MIN_W);
        if (r.dir.includes("s")) bottom = clamp(r.bottom + dy, top + MIN_H, b.bottom);
        if (r.dir.includes("n")) top = clamp(r.top + dy, b.top, bottom - MIN_H);
        setOffset({ x: left - r.baseLeft, y: top - r.baseTop });
        setSize({ w: right - left, h: bottom - top });
        return;
      }
      const d = dragRef.current;
      if (!d) return;
      setOffset({
        x: clamp(d.origX + e.clientX - d.startX, d.rangeX[0], d.rangeX[1]),
        y: clamp(d.origY + e.clientY - d.startY, d.rangeY[0], d.rangeY[1]),
      });
    };
    const handleMouseUp = () => {
      pendingRef.current = null;
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => { writeJSON(STORAGE_KEY, offset); }, [offset]);
  useEffect(() => { writeJSON(SIZE_KEY, size); }, [size]);
  useEffect(() => { writeJSON(ZOOM_KEY, restore); }, [restore]);

  if (closed) {
    return (
      <div className="h-full flex items-center justify-center">
        <ClosedMessage />
      </div>
    );
  }

  if (booting) {
    const headIndex = Math.floor(spinFrame / 4) % 8;
    return (
      <div className="h-full flex items-center justify-center">
        <div className="relative w-8 h-8">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((pos) => {
            const angle = pos * 45;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * 12;
            const y = Math.sin(rad) * 12;
            const behind = (headIndex - pos + 8) % 8;
            const scale = 1 - behind * 0.09;
            const opacity = 1 - behind * 0.12;
            return (
              <div
                key={pos}
                className="absolute top-1/2 left-1/2 transition-all duration-100"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(45deg) scale(${Math.max(0.3, scale)})`,
                  opacity: Math.max(0.08, opacity),
                }}
              >
                <div
                  className="w-[5px] h-[5px]"
                  style={{ backgroundColor: `hsl(0, 0%, ${40 + behind * 4}%)` }}
                />
              </div>
            );
          })}
          {bootPhase === 'almost' && (
            <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap font-mono">loading ...</p>
          )}
        </div>
      </div>
    );
  }

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        {/* Close button */}
        <button
          onClick={() => setFullscreen(false)}
          className="fixed top-4 left-4 z-[10000] w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Exit fullscreen"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
        {/* Terminal content centered */}
        <div className="w-full max-w-4xl max-h-[80vh] overflow-auto">
          {children}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="terminal-window"
      data-zoomed={zoomed || undefined}
      className={`relative flex flex-col h-full overflow-hidden rounded-xl border border-border shadow-[0_8px_32px_-8px_hsl(var(--foreground)/0.15)] animate-scale-in ${animMs ? 'transition-[transform,width,height]' : ''}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, width: size?.w, height: size?.h, transitionDuration: animMs ? `${animMs}ms` : undefined, transitionTimingFunction: animMs ? EASE : undefined }}
    >
      {/* Title bar - drag handle, double-click to zoom */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={`flex items-center gap-2 px-4 h-8 bg-[hsl(210,5%,18%)] shrink-0 select-none cursor-default`}
      >
        <div className="group/btns flex items-center gap-1.5">
          <span
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-[hsl(0,72%,55%)] group-hover/btns:bg-[hsl(0,72%,65%)] transition-colors cursor-default relative flex items-center justify-center"
          >
            <svg className="w-2 h-2 opacity-0 group-hover/btns:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="hsl(0,0%,20%)" strokeWidth="2"><path d="M3 3l6 6M9 3l-6 6"/></svg>
          </span>
          <span
            onClick={onMinimize}
            className="w-3 h-3 rounded-full bg-[hsl(50,95%,55%)] group-hover/btns:bg-[hsl(50,95%,65%)] transition-colors cursor-default relative flex items-center justify-center"
          >
            <svg className="w-2 h-2 opacity-0 group-hover/btns:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="hsl(0,0%,20%)" strokeWidth="2"><path d="M2 6h8"/></svg>
          </span>
          <span
            onClick={() => { if (!disableFullscreen) { if (onFullscreen) onFullscreen(); else setFullscreen(true); } }}
            className={`w-3 h-3 rounded-full transition-colors cursor-default relative flex items-center justify-center ${disableFullscreen ? 'bg-[hsl(0,0%,30%)]' : 'bg-[hsl(140,60%,48%)] group-hover/btns:bg-[hsl(140,60%,58%)]'}`}
          >
            {!disableFullscreen && <svg className="w-[7px] h-[7px] opacity-0 group-hover/btns:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="hsl(0,0%,20%)" strokeWidth="2"><polygon points="3,1 10,6 3,11"/></svg>}
          </span>
        </div>
        <span className="flex-1 text-center text-xs text-muted-foreground truncate">
          {title}
        </span>
      </div>
      {/* Terminal body */}
      <div ref={bodyRef} data-testid="terminal-body" className="flex-1 bg-background overflow-y-auto overscroll-contain">
        {children}
      </div>
      {/* Resize handles */}
      {HANDLES.map(({ dir, className }) => (
        <div
          key={dir}
          aria-hidden
          data-resize={dir}
          onMouseDown={handleResizeDown(dir)}
          className={`absolute ${className}`}
        />
      ))}
    </div>
  );
};

export default TerminalWindow;
