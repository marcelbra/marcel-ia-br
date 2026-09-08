import TerminalWindow from "@/components/TerminalWindow";
import Header from "@/components/Header";
import type { SectionName } from "@/components/Header";
import Hero from "@/components/Hero";
import CvSection from "@/components/CvSection";
import AcademicsSection from "@/components/AcademicsSection";
import WritingPostCard from "@/components/WritingPostCard";
import SectionHeading from "@/components/SectionHeading";
import Footer from "@/components/Footer";
import { posts } from "@/pages/Writing";
import { FIT_BOUNDARY, useFittingList } from "@/hooks/use-fitting-list";
import { useState } from "react";

const RECENT_POSTS = 3;

/**
 * The most recent posts, cut to what the terminal has room for. Three is what
 * the front page offers; a phone rarely has the height for three cards under
 * the heading, and a card half off the bottom edge is not an offer at all —
 * the rest are behind "Read all posts", which is a page that may scroll.
 */
const RecentPosts = () => {
  const [listRef, visible, height] = useFittingList<HTMLDivElement>(RECENT_POSTS);

  return (
    <div ref={listRef} style={{ height }} className="overflow-hidden">
      {posts.slice(0, RECENT_POSTS).map((post, i) => (
        <div key={post.slug} style={{ visibility: i < visible ? undefined : "hidden" }}>
          <WritingPostCard {...post} />
        </div>
      ))}
    </div>
  );
};

const sections = ["marcel", "cv", "academics", "writing"] as const;

const Index = () => {
  const [activeSection, setActiveSection] = useState<SectionName>("marcel");
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(() => sessionStorage.getItem("terminal-minimized") === "true");
  const [terminalClosed, setTerminalClosed] = useState(() => sessionStorage.getItem("terminal-closed") === "true");

  const handleMinimize = () => {
    setMinimized(true);
    sessionStorage.setItem("terminal-minimized", "true");
  };

  const handleRestore = () => {
    setMinimized(false);
    sessionStorage.removeItem("terminal-minimized");
  };

  const navigateToSection = (index: number) => {
    const target = sections[index];
    if (target === "marcel" || target === "cv" || target === "academics") {
      setExpanded(false);
    }
    setActiveSection(target);
  };

  const terminalTitle = `~/${activeSection} — zsh — 122×37`;

  const renderContent = () => {
      if (activeSection === "marcel") {
      return (
        <section {...(expanded ? {} : { [FIT_BOUNDARY]: true })} className={`px-6 ${expanded ? 'pt-6' : 'py-6 flat:py-3 h-full flex flex-col'}`}>
          <div className={`w-full max-w-3xl ${expanded ? 'mx-auto' : 'm-auto shrink-0'}`}>
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
    }

    if (activeSection === "cv") {
      return <CvSection />;
    }

    if (activeSection === "academics") {
      return <AcademicsSection />;
    }

    if (activeSection === "writing") {
      return (
        <section {...(expanded ? {} : { [FIT_BOUNDARY]: true })} className={`px-6 ${expanded ? 'pt-6' : 'py-6 flat:py-3 h-full flex flex-col'}`}>
          <div className={`w-full max-w-3xl ${expanded ? 'mx-auto' : 'm-auto shrink-0'}`}>
            {expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="mb-4 font-mono text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                ← back
              </button>
            )}
            <SectionHeading label="Writing" title={expanded ? "All Posts" : "Recent Posts"} />
            {expanded ? (
              <div>
                {posts.map((post) => (
                  <WritingPostCard key={post.slug} {...post} />
                ))}
              </div>
            ) : (
              <RecentPosts />
            )}
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="inline-block mt-6 flat:mt-3 font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Read all posts →
              </button>
            )}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className={`bg-background flex flex-col ${expanded ? 'min-h-viewport' : 'h-viewport overflow-hidden'}`}>
      <Header activeSection={activeSection} onNavigate={navigateToSection} disabled={terminalClosed} />
      {/* The terminal is centred in whatever room is left and clamped to it —
          min-h-0 is what lets it be squeezed rather than push the page taller.
          Expanded, the same room is a document instead: it starts at the top,
          takes the height it needs, and is padded only enough to clear the
          header and the footer, which are both fixed over it. Every pixel of
          padding beyond them is a pixel of scroll on a section that would
          otherwise have fitted on the screen. */}
      <main className={`flex-1 flex flex-col items-center px-6 ${expanded
        ? 'pt-16 pb-16'
        : 'justify-center min-h-0 pt-20 pb-20 [@media(max-height:640px)]:pt-16 [@media(max-height:640px)]:pb-8 [@media(max-height:480px)]:pt-14 [@media(max-height:480px)]:pb-4'}`}>
        <div className={`w-full max-w-4xl ${expanded ? '' : 'h-full'}`}>
          {expanded ? (
            renderContent()
          ) : minimized ? (
            <div className="h-full max-h-[70vh] flex items-center justify-center">
              <span className="font-mono text-sm text-muted-foreground/40 animate-fade-in">
                minimized to dock ↓
              </span>
            </div>
          ) : (
            <div className="h-full max-h-[70vh]">
              <TerminalWindow title={terminalTitle} onMinimize={handleMinimize} onClose={() => setTerminalClosed(true)} onBooted={() => setTerminalClosed(false)} onFullscreen={() => { if (activeSection === "marcel" || activeSection === "writing") setExpanded(true); }} disableFullscreen={activeSection === "cv" || activeSection === "academics"}>
                {renderContent()}
              </TerminalWindow>
            </div>
          )}
        </div>
      </main>
      <Footer minimized={minimized} onRestore={handleRestore} fixed={expanded} disabled={terminalClosed} />
    </div>
  );
};

export default Index;
