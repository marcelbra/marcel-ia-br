import { ReactNode } from "react";

interface TerminalWindowProps {
  title?: string;
  children: ReactNode;
}

const TerminalWindow = ({ title = "~/marcel — zsh — 122×37", children }: TerminalWindowProps) => {
  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-border shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 h-8 bg-[hsl(210,5%,18%)] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[hsl(0,72%,55%)] hover:bg-[hsl(0,72%,65%)] transition-colors cursor-default group relative flex items-center justify-center">
            <svg className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="hsl(0,0%,20%)" strokeWidth="2"><path d="M3 3l6 6M9 3l-6 6"/></svg>
          </span>
          <span className="w-3 h-3 rounded-full bg-[hsl(50,95%,55%)] hover:bg-[hsl(50,95%,65%)] transition-colors cursor-default group relative flex items-center justify-center">
            <svg className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="hsl(0,0%,20%)" strokeWidth="2"><path d="M2 6h8"/></svg>
          </span>
          <span className="w-3 h-3 rounded-full bg-[hsl(140,60%,48%)] hover:bg-[hsl(140,60%,58%)] transition-colors cursor-default group relative flex items-center justify-center">
            <svg className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="hsl(0,0%,20%)" strokeWidth="1.5"><path d="M2 3.5L5 1.5v9l-3-2zM7 3.5L10 1.5v9l-3-2z"/></svg>
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
