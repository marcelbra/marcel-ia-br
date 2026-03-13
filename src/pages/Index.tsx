import TerminalWindow from "@/components/TerminalWindow";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import BlogPostCard from "@/components/BlogPostCard";
import SectionHeading from "@/components/SectionHeading";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useState } from "react";

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

const sections = ["marcel", "projects", "blog"] as const;
export type SectionName = (typeof sections)[number];

const Index = () => {
  const [activeSection, setActiveSection] = useState<SectionName>("marcel");

  const navigateToSection = (index: number) => {
    setActiveSection(sections[index]);
  };

  const terminalTitle = `~/${activeSection} — zsh — 122×37`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header activeSection={activeSection} onNavigate={navigateToSection} />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-4xl h-[70vh]">
          <TerminalWindow title={terminalTitle}>
            <div className="flex-1 overflow-y-auto h-full">
              {activeSection === "marcel" && (
                <section className="min-h-full flex flex-col justify-center px-6">
                  <Hero />
                </section>
              )}

              {activeSection === "projects" && (
                <section className="min-h-full flex flex-col justify-start pt-6 px-6">
                  <div className="max-w-3xl mx-auto w-full">
                    <SectionHeading label="Projects" title="Selected Projects" />
                    <div className="space-y-1">
                      {projects.map((project) => (
                        <ProjectCard key={project.title} {...project} />
                      ))}
                    </div>
                    <Link
                      to="/projects"
                      className="inline-block mt-6 font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      View all projects →
                    </Link>
                  </div>
                </section>
              )}

              {activeSection === "blog" && (
                <section className="min-h-full flex flex-col justify-start pt-6 px-6">
                  <div className="max-w-3xl mx-auto w-full">
                    <SectionHeading label="Writing" title="Recent Posts" />
                    <div>
                      {posts.map((post) => (
                        <BlogPostCard key={post.slug} {...post} />
                      ))}
                    </div>
                    <Link
                      to="/blog"
                      className="inline-block mt-6 font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Read all posts →
                    </Link>
                  </div>
                </section>
              )}
            </div>
          </TerminalWindow>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
