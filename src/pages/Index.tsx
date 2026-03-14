import TerminalWindow from "@/components/TerminalWindow";
import Header from "@/components/Header";
import type { SectionName } from "@/components/Header";
import Hero from "@/components/Hero";
import CvSection from "@/components/CvSection";
import ProjectCard from "@/components/ProjectCard";
import BlogPostCard from "@/components/BlogPostCard";
import SectionHeading from "@/components/SectionHeading";
import Footer from "@/components/Footer";
import { projects } from "@/pages/Projects";
import { posts } from "@/pages/Blog";
import { useState } from "react";

const FEATURED_PROJECTS = 3;
const RECENT_POSTS = 3;

const sections = ["marcel", "cv", "projects", "blog"] as const;

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
    if (target === "marcel" || target === "cv") {
      setExpanded(false);
    }
    setActiveSection(target);
  };

  const terminalTitle = `~/${activeSection} — zsh — 122×37`;

  const renderContent = () => {
      if (activeSection === "marcel") {
      return (
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
    }

    if (activeSection === "cv") {
      return <CvSection />;
    }

    if (activeSection === "projects") {
      return (
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
            <SectionHeading label="Projects" title={expanded ? "All Projects" : "Selected Projects"} />
            <div className="space-y-1">
              {(expanded ? projects : projects.slice(0, FEATURED_PROJECTS)).map((project) => (
                <ProjectCard key={project.title} {...project} />
              ))}
            </div>
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="inline-block mt-6 font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View all projects →
              </button>
            )}
          </div>
        </section>
      );
    }

    if (activeSection === "blog") {
      return (
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
                <BlogPostCard key={post.slug} {...post} />
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
    }

    return null;
  };

  return (
    <div className={`bg-background flex flex-col ${expanded ? 'min-h-screen' : 'h-screen overflow-hidden'}`}>
      <Header activeSection={activeSection} onNavigate={navigateToSection} disabled={terminalClosed} />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 min-h-0">
        <div className="w-full max-w-4xl h-full">
          {expanded ? (
            <div className="py-6">
              {renderContent()}
            </div>
          ) : minimized ? (
            <div className="h-[70vh] flex items-center justify-center">
              <span className="font-mono text-sm text-muted-foreground/40 animate-fade-in">
                minimized to dock ↓
              </span>
            </div>
          ) : (
            <div className="h-[70vh]">
              <TerminalWindow title={terminalTitle} onMinimize={handleMinimize} onClose={() => setTerminalClosed(true)} onBooted={() => setTerminalClosed(false)} onFullscreen={() => { if (activeSection === "marcel" || activeSection === "projects" || activeSection === "blog") setExpanded(true); }} disableFullscreen={activeSection === "cv"}>
                <div className="flex-1 overflow-y-auto h-full">
                  {renderContent()}
                </div>
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
