import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { SectionName } from "@/pages/Index";

const links = [
  { label: "marcel", index: 0 },
  { label: "cv", index: 1 },
  { label: "projects", index: 2 },
  { label: "blog", index: 3 },
];

interface HeaderProps {
  activeSection?: SectionName;
  onNavigate?: (index: number) => void;
  disabled?: boolean;
}

const Header = ({ activeSection = "marcel", onNavigate, disabled }: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const currentLabel = isHome
    ? `~/${activeSection}`
    : location.pathname === "/projects"
      ? "~/projects"
      : location.pathname === "/blog"
        ? "~/blog"
        : "~/marcel";

  const handleNav = (index: number) => {
    if (isHome && onNavigate) {
      onNavigate(index);
      setMobileOpen(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border transition-opacity ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <nav className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
        <span className="text-ansi-green font-bold tracking-tight">
          {currentLabel}
        </span>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-1">
          {links.map((link, i) => (
            <li key={link.label} className="flex items-center">
              {i > 0 && <span className="text-muted-foreground mx-1">/</span>}
              <button
                onClick={() => handleNav(link.index)}
                className={`text-sm px-2 py-1 transition-colors ${
                  activeSection === link.label
                    ? "text-ansi-yellow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors text-sm"
          aria-label="Toggle menu"
        >
          {mobileOpen ? "[x]" : "[=]"}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <ul className="max-w-4xl mx-auto px-6 py-3 flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.label}>
                <button
                  onClick={() => handleNav(link.index)}
                  className={`text-sm block py-1 transition-colors w-full text-left ${
                    activeSection === link.label
                      ? "text-ansi-yellow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  → {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;
