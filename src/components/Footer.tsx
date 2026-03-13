import MiniTerminal from "./MiniTerminal";

interface FooterProps {
  minimized?: boolean;
  onRestore?: () => void;
  fixed?: boolean;
}

const Footer = ({ minimized, onRestore, fixed }: FooterProps) => {
  return (
    <footer className={`border-t border-border py-4 px-6 bg-background ${fixed ? 'fixed bottom-0 left-0 right-0 z-40' : ''}`}>
      <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground h-5">
        <span>
          <span className="text-ansi-green">$</span> echo © {new Date().getFullYear()}
        </span>
        <span className="flex items-center gap-2">
          {minimized && onRestore && (
            <span className="animate-scale-in flex items-center">
              <MiniTerminal onClick={onRestore} />
            </span>
          )}
          <span className="text-ansi-blue leading-none">[EOF]</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;