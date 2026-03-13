import { ReactNode, useState, useRef, useCallback, useEffect } from "react";
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
const CLOSED_KEY = "terminal-closed";
const MARGIN = 12;

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const loadOffset = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as { x: number; y: number };
  } catch {}
  return { x: 0, y: 0 };
};

const TerminalWindow = ({ title = "~/marcel — zsh — 122×37", children, onMinimize, onFullscreen, onClose, onBooted, disableFullscreen }: TerminalWindowProps) => {
  const wasClosed = sessionStorage.getItem(CLOSED_KEY) === "true";
  const [closed, setClosed] = useState(false);
  const [booting, setBooting] = useState(wasClosed);
  const [bootPhase, setBootPhase] = useState<'spinning' | 'almost'>('spinning');
  const [spinFrame, setSpinFrame] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [offset, setOffset] = useState(() => wasClosed ? { x: 0, y: 0 } : loadOffset());
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // On mount: if was closed, clear flag, reset position, show loader for 1s
  useEffect(() => {
    if (wasClosed) {
      sessionStorage.removeItem(CLOSED_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
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

  const handleClose = () => {
    setClosed(true);
    sessionStorage.setItem(CLOSED_KEY, "true");
    sessionStorage.removeItem(STORAGE_KEY);
    onClose?.();
  };

  const clampOffset = useCallback((x: number, y: number) => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const rect = el.getBoundingClientRect();
    const elW = rect.width;
    const elH = rect.height;
    const baseTop = rect.top - offset.y;
    const baseLeft = rect.left - offset.x;

    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;

    const minY = headerBottom + MARGIN - baseTop;
    const maxY = footerTop - MARGIN - baseTop - elH;
    const minX = -baseLeft + MARGIN;
    const maxX = window.innerWidth - baseLeft - elW - MARGIN;

    return {
      x: Math.max(minX, Math.min(x, maxX)),
      y: Math.max(minY, Math.min(y, maxY)),
    };
  }, [offset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (fullscreen) return;
    if ((e.target as HTMLElement).closest('.group\\/btns')) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    e.preventDefault();
  }, [offset, fullscreen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newOffset = clampOffset(dragRef.current.origX + dx, dragRef.current.origY + dy);
      setOffset(newOffset);
    };
    const handleMouseUp = () => {
      if (dragRef.current) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(offset));
      }
      dragRef.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [clampOffset, offset]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(offset));
  }, [offset]);

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
      className="flex flex-col h-full rounded-xl overflow-hidden border border-border shadow-[0_8px_32px_-8px_hsl(var(--foreground)/0.15)] animate-scale-in"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      {/* Title bar - drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center gap-2 px-4 h-8 bg-[hsl(210,5%,18%)] shrink-0 select-none cursor-default"
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
    </div>
  );
};

export default TerminalWindow;