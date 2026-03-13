import MiniTerminal from "./MiniTerminal";

interface FooterProps {
  minimized?: boolean;
  onRestore?: () => void;
}

const Footer = ({ minimized, onRestore }: FooterProps) => {
  return (
    <footer className="border-t border-border py-6 px-6 mt-16">
      <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className="text-ansi-green">$</span> echo © {new Date().getFullYear()}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-ansi-blue">[EOF]</span>
          {minimized && onRestore && (
            <span className="animate-fade-in">
              <MiniTerminal onClick={onRestore} />
            </span>
          )}
        </span>
      </div>
    </footer>
  );
};

export default Footer;