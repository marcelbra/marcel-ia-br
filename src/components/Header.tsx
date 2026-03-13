import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "about" },
  { to: "/projects", label: "projects" },
  { to: "/blog", label: "blog" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <nav className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
        <NavLink to="/" className="text-ansi-green font-bold tracking-tight hover:opacity-80 transition-opacity">
          ~/jdoe
        </NavLink>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-1">
          {links.map((link, i) => (
            <li key={link.to} className="flex items-center">
              {i > 0 && <span className="text-muted-foreground mx-1">/</span>}
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `text-sm px-2 py-1 transition-colors ${
                    isActive ? "text-ansi-yellow" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {link.label}
              </NavLink>
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
          <ul className="max-w-3xl mx-auto px-6 py-3 flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `text-sm block py-1 transition-colors ${
                      isActive ? "text-ansi-yellow" : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  → {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;
