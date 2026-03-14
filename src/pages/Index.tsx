import TerminalWindow from "@/components/TerminalWindow";
import Header from "@/components/Header";
import type { SectionName } from "@/components/Header";
import Hero from "@/components/Hero";
import CvSection from "@/components/CvSection";
import WritingPostCard from "@/components/WritingPostCard";
import SectionHeading from "@/components/SectionHeading";
import Footer from "@/components/Footer";
import { posts } from "@/pages/Writing";
import { useState, useRef, useCallback, useEffect } from "react";

const RECENT_POSTS = 3;

const sections: SectionName[] = ["marcel", "cv", "writing"];

const Index = () => {
  const [activeSection, setActiveSection] = useState<SectionName>("marcel");
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(() => sessionStorage.getItem("terminal-minimized") === "true");
  const [terminalClosed, setTerminalClosed] = useState(() => sessionStorage.getItem("terminal-closed") === "true");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgNavRef = useRef(false);

  const handleMinimize = () => {
    setMinimized(true);
    sessionStorage.setItem("terminal-minimized", "true");
  };

  const handleRestore = () => {
    setMinimized(false);
    sessionStorage.removeItem("terminal-minimized");
  };

  const scrollToSection = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    isProgNavRef.current = true;
    container.scrollTo({ left: index * container.clientWidth, behavior: "smooth" });
    // Reset flag after scroll completes
    setTimeout(() => { isProgNavRef.current = false; }, 500);
  }, []);

  const navigateToSection = useCallback((index: number) => {
    const target = sections[index];
    if (target === "marcel" || target === "cv") {
      setExpanded(false);
    }
    setActiveSection(target);
    scrollToSection(index);
  }, [scrollToSection]);

  // Sync activeSection on scroll snap
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let ticking = false;
    const handleScroll = () => {
      if (isProgNavRef.current) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!container) return;
        const w = container.clientWidth;
        if (w === 0) return;
        const index = Math.round(container.scrollLeft / w);
        const clamped = Math.max(0, Math.min(sections.length - 1, index));
        const target = sections[clamped];
        setActiveSection((prev) => {
          if (prev !== target) {
            if (target === "marcel" || target === "cv") {
              setExpanded(false);
            }
            return target;
          }
          return prev;
        });
      });
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const terminalTitle = `~/${activeSection} — zsh — 122×37`;

  const renderMarcel = () => (
    <section className={`px-6 ${expanded ? 'pt-6' : 'min-h-full flex flex-col justify-center'}`}>
      <div className="max-w-3xl mx-auto w-full">
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="mb-4 font-mono text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            ← back
          </button>
        )}
        <Hero />
      </div>
    </section>
  );

  const renderCv = () => <CvSection />;

  const renderWriting = () => (
    <section className={`px-6 ${expanded ? 'pt-6' : 'min-h-full flex flex-col justify-center'}`}>
      <div className="max-w-3xl mx-auto w-full">
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="mb-4 font-mono text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            ← back
          </button>
        )}
        <SectionHeading label="Writing" title={expanded ? "All Posts" : "Recent Posts"} />
        <div>
          {(expanded ? posts : posts.slice(0, RECENT_POSTS)).map((post) => (
            <WritingPostCard key={post.slug} {...post} />
          ))}
        </div>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="inline-block mt-6 font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Read all posts →
          </button>
        )}
      </div>
    </section>
  );

  const renderers = [renderMarcel, renderCv, renderWriting];

  const scrollContent = (
    <div
      ref={scrollRef}
      className="flex-1 flex overflow-x-auto snap-x snap-mandatory h-full"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
    >
      {renderers.map((render, i) => (
        <div
          key={sections[i]}
          className="snap-center shrink-0 w-full h-full overflow-y-auto"
        >
          {render()}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`bg-background flex flex-col ${expanded ? 'min-h-screen' : 'h-screen overflow-hidden'}`}>
      <Header activeSection={activeSection} onNavigate={navigateToSection} disabled={terminalClosed} />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 min-h-0">
        <div className="w-full max-w-4xl h-full">
          {expanded ? (
            <div className="py-6">
              {renderers[sections.indexOf(activeSection)]()}
            </div>
          ) : minimized ? (
            <div className="h-[70vh] flex items-center justify-center">
              <span className="font-mono text-sm text-muted-foreground/40 animate-fade-in">
                minimized to dock ↓
              </span>
            </div>
          ) : (
            <div className="h-[70vh]">
              <TerminalWindow title={terminalTitle} onMinimize={handleMinimize} onClose={() => setTerminalClosed(true)} onBooted={() => setTerminalClosed(false)} onFullscreen={() => { if (activeSection === "marcel" || activeSection === "writing") setExpanded(true); }} disableFullscreen={activeSection === "cv"}>
                {scrollContent}
              </TerminalWindow>
            </div>
          )}
        </div>
      </main>
      <Footer minimized={minimized} onRestore={handleRestore} fixed={expanded} disabled={terminalClosed} />
      <style>{`
        [class*="snap-x"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Index;
