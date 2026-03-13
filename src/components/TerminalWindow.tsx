import { ReactNode, useState, useRef, useCallback, useEffect } from "react";

interface TerminalWindowProps {
  title?: string;
  children: ReactNode;
  onMinimize?: () => void;
}

const STORAGE_KEY = "terminal-offset";
const MARGIN = 12;

const loadOffset = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as { x: number; y: number };
  } catch {}
  return { x: 0, y: 0 };
};

const TerminalWindow = ({ title = "~/marcel — zsh — 122×37", children, onMinimize }: TerminalWindowProps) => {
  const [closed, setClosed] = useState(false);
  const [offset, setOffset] = useState(loadOffset);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampOffset = useCallback((x: number, y: number) => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const rect = el.getBoundingClientRect();
    const baseTop = rect.top - offset.y;
    const baseBottom = rect.bottom - offset.y;
    // Don't let top edge go above MARGIN from viewport top
    const minY = -baseTop + MARGIN;
    // Don't let bottom edge go below viewport bottom minus MARGIN
    const maxY = window.innerHeight - baseBottom - MARGIN;
    return { x, y: Math.max(minY, Math.min(y, maxY)) };
  }, [offset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.group\\/btns')) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    e.preventDefault();
  }, [offset]);

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

  // Save offset whenever it changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(offset));
  }, [offset]);

  if (closed) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-lg text-muted-foreground/30 tracking-wide">
          F5 / ⌘ + R
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full rounded-xl overflow-hidden border border-border shadow-2xl"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      {/* Title bar - drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center gap-2 px-4 h-8 bg-[hsl(210,5%,18%)] shrink-0 select-none cursor-grab active:cursor-grabbing"
      >
        <div className="group/btns flex items-center gap-1.5">
          <span
            onClick={() => setClosed(true)}
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
          <span className="w-3 h-3 rounded-full bg-[hsl(140,60%,48%)] group-hover/btns:bg-[hsl(140,60%,58%)] transition-colors cursor-default relative flex items-center justify-center">
            <svg className="w-[7px] h-[7px] opacity-0 group-hover/btns:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="hsl(0,0%,20%)" strokeWidth="2"><polygon points="3,1 10,6 3,11"/></svg>
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