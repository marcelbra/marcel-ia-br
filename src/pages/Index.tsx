import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import BlogPostCard from "@/components/BlogPostCard";
import SectionHeading from "@/components/SectionHeading";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />

        {/* Projects */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <SectionHeading label="Work" title="Selected Projects" />
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
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
