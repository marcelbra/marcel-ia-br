import { ReactNode } from "react";

interface TerminalWindowProps {
  title?: string;
  children: ReactNode;
}

const TerminalWindow = ({ title = "~/marcel — zsh — 122×37", children }: TerminalWindowProps) => {
  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border border-border shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 h-8 bg-[hsl(210,5%,18%)] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[hsl(0,72%,55%)]" />
          <span className="w-3 h-3 rounded-full bg-[hsl(50,95%,55%)]" />
          <span className="w-3 h-3 rounded-full bg-[hsl(140,60%,48%)]" />
        </div>
        <span className="flex-1 text-center text-xs text-muted-foreground truncate">
          {title}
        </span>
      </div>
      {/* Terminal body */}
      <div className="flex-1 bg-background overflow-y-auto snap-y snap-mandatory">
        {children}
      </div>
    </div>
  );
};

export default TerminalWindow;
