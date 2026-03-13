import MiniTerminal from "./MiniTerminal";

interface FooterProps {
  minimized?: boolean;
  onRestore?: () => void;
}

const Footer = ({ minimized, onRestore }: FooterProps) => {
  return (
    <footer className="border-t border-border py-4 px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className="text-ansi-green">$</span> echo © {new Date().getFullYear()}
        </span>
        <span className="flex items-center gap-2">
          {minimized && onRestore && (
            <span className="animate-scale-in">
              <MiniTerminal onClick={onRestore} />
            </span>
          )}
          <span className="text-ansi-blue">[EOF]</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;