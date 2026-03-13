interface MiniTerminalProps {
  onClick: () => void;
}

const MiniTerminal = ({ onClick }: MiniTerminalProps) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex flex-col w-8 h-5 rounded-sm overflow-hidden border border-border shadow-md hover:scale-110 transition-transform cursor-default"
    >
      {/* Mini title bar */}
      <div className="flex items-center gap-[2px] px-0.5 h-1.5 bg-[hsl(210,5%,18%)] shrink-0">
        <span className="w-[3px] h-[3px] rounded-full bg-[hsl(0,72%,55%)]" />
        <span className="w-[3px] h-[3px] rounded-full bg-[hsl(50,95%,55%)]" />
        <span className="w-[3px] h-[3px] rounded-full bg-[hsl(140,60%,48%)]" />
      </div>
      {/* Mini body */}
      <div className="flex-1 bg-background flex items-center justify-center">
        <span className="text-[3px] text-muted-foreground font-mono">~$</span>
      </div>
    </button>
  );
};

export default MiniTerminal;