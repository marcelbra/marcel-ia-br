import TerminalWindow from "@/components/TerminalWindow";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BlogPostCard from "@/components/BlogPostCard";
import SectionHeading from "@/components/SectionHeading";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveSection(sections[idx]);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <Header activeSection={activeSection} onNavigate={scrollToSection} />
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory"
      >
        {/* Marcel / About */}
        <section
          ref={(el) => { sectionRefs.current[0] = el; }}
          className="snap-start min-h-screen flex flex-col justify-center px-6"
        >
          <Hero />
        </section>

        {/* Projects */}
        <section
          ref={(el) => { sectionRefs.current[1] = el; }}
          className="snap-start min-h-screen flex flex-col justify-center px-6"
        >
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

        {/* Blog */}
        <section
          ref={(el) => { sectionRefs.current[2] = el; }}
          className="snap-start min-h-screen flex flex-col justify-center px-6"
        >
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
          <div className="max-w-3xl mx-auto w-full mt-auto">
            <Footer />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
