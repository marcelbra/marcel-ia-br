import TerminalWindow from "@/components/TerminalWindow";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CvSection from "@/components/CvSection";
import ProjectCard from "@/components/ProjectCard";
import BlogPostCard from "@/components/BlogPostCard";
import SectionHeading from "@/components/SectionHeading";
import Footer from "@/components/Footer";
import { useState } from "react";

// ... keep existing code
const projects = [
  {
    title: "Meridian",
    description: "A minimal note-taking app with markdown support and local-first sync.",
    tags: ["React", "TypeScript", "IndexedDB"],
    link: "#",
    year: "2025",
  },
  {
    title: "Chroma",
    description: "Color palette generator that learns from your design preferences over time.",
    tags: ["Svelte", "ML", "Design"],
    link: "#",
    year: "2024",
  },
  {
    title: "Terrace",
    description: "Open-source CLI for scaffolding full-stack projects with sensible defaults.",
    tags: ["Node.js", "CLI", "Open Source"],
    link: "#",
    year: "2024",
  },
];

const extraProjects = [
  {
    title: "Drift",
    description: "A ambient sound mixer for focus and deep work sessions.",
    tags: ["Web Audio", "React", "PWA"],
    link: "#",
    year: "2023",
  },
  {
    title: "Canopy",
    description: "Personal finance tracker with beautiful data visualizations.",
    tags: ["D3.js", "Node.js", "PostgreSQL"],
    link: "#",
    year: "2023",
  },
];

const posts = [
  {
    title: "On building things that last",
    excerpt: "Why I've started caring less about trends and more about longevity in software.",
    date: "Mar 2026",
    slug: "building-things-that-last",
  },
  {
    title: "The case for boring technology",
    excerpt: "Sometimes the best stack is the one nobody writes blog posts about.",
    date: "Jan 2026",
    slug: "boring-technology",
  },
  {
    title: "Designing for yourself first",
    excerpt: "How personal projects taught me more than any client work ever did.",
    date: "Nov 2025",
    slug: "designing-for-yourself",
  },
];

const extraPosts = [
  {
    title: "Why I left my job to build in public",
    excerpt: "The scariest and most rewarding decision I've made in my career so far.",
    date: "Sep 2025",
    slug: "building-in-public",
  },
  {
    title: "A love letter to the terminal",
    excerpt: "Why I keep coming back to the command line after all these years.",
    date: "Jul 2025",
    slug: "love-letter-terminal",
  },
];

const sections = ["marcel", "cv", "projects", "blog"] as const;
export type SectionName = (typeof sections)[number];

const Index = () => {
  const [activeSection, setActiveSection] = useState<SectionName>("marcel");
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const navigateToSection = (index: number) => {
    if (sections[index] === "marcel") {
      setExpanded(false);
    }
    setActiveSection(sections[index]);
  };

  const terminalTitle = `~/${activeSection} — zsh — 122×37`;

  const renderContent = () => {
    if (activeSection === "marcel") {
      return (
        <section className="min-h-full flex flex-col justify-center px-6">
          <Hero />
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
              {projects.map((project) => (
                <ProjectCard key={project.title} {...project} />
              ))}
              {expanded && extraProjects.map((project) => (
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
              {posts.map((post) => (
                <BlogPostCard key={post.slug} {...post} />
              ))}
              {expanded && extraPosts.map((post) => (
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
      <Header activeSection={activeSection} onNavigate={navigateToSection} />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 min-h-0">
        <div className="w-full max-w-4xl h-full">
          {expanded ? (
            <div className="py-6">
              {renderContent()}
            </div>
          ) : (
            <div className="h-[70vh]">
              <TerminalWindow title={terminalTitle}>
                <div className="flex-1 overflow-y-auto h-full">
                  {renderContent()}
                </div>
              </TerminalWindow>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
