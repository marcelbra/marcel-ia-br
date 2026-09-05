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
const MIN_W = 320;
const MIN_H = 160;
const ZOOM_MS = 200;

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
  const [animating, setAnimating] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; rangeX: [number, number]; rangeY: [number, number] } | null>(null);
  const resizeRef = useRef<{ dir: Direction; startX: number; startY: number; baseLeft: number; baseTop: number; left: number; top: number; right: number; bottom: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout>>();
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const zoomed = restore !== null;
  const zoomedRef = useRef(zoomed);
  zoomedRef.current = zoomed;
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

  const startAnim = () => {
    setAnimating(true);
    clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => setAnimating(false), ZOOM_MS + 20);
  };

  const handleClose = () => {
    setClosed(true);
    sessionStorage.setItem(CLOSED_KEY, "true");
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SIZE_KEY);
    sessionStorage.removeItem(ZOOM_KEY);
    onClose?.();
  };

  /** Where the window sits before the offset is applied. */
  const origin = (rect: DOMRect) => ({ left: rect.left - offsetRef.current.x, top: rect.top - offsetRef.current.y });

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
    touchedRef.current = true;
    startAnim();
    if (restore) {
      setOffset(restore.offset);
      setSize(restore.size);
      setRestore(null);
      return;
    }
    setRestore({ offset, size });
    fillBounds();
  }, [restore, offset, size, fillBounds]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group\\/btns')) return;
    toggleZoom();
  }, [toggleZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomed) return;
    if ((e.target as HTMLElement).closest('.group\\/btns')) return;
    const el = containerRef.current;
    if (!el) return;
    touchedRef.current = true;
    const rect = el.getBoundingClientRect();
    const base = origin(rect);
    const b = bounds();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
      rangeX: [b.left - base.left, b.right - rect.width - base.left],
      rangeY: [b.top - base.top, b.bottom - rect.height - base.top],
    };
    e.preventDefault();
  }, [offset, zoomed]);

  const handleResizeDown = useCallback((dir: Direction) => (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    touchedRef.current = true;
    const rect = el.getBoundingClientRect();
    const base = origin(rect);
    resizeRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      baseLeft: base.left,
      baseTop: base.top,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    };
    // Resizing a zoomed window means it is no longer zoomed — it keeps the size
    // it is being given, and the next double-click fills the bounds again.
    setRestore(null);
    setAnimating(false);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
      className={`relative flex flex-col h-full overflow-hidden border border-border shadow-[0_8px_32px_-8px_hsl(var(--foreground)/0.15)] animate-scale-in ${zoomed ? 'rounded-none' : 'rounded-xl'} ${animating ? 'transition-[transform,width,height] duration-200 ease-out' : ''}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, width: size?.w, height: size?.h }}
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
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
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
