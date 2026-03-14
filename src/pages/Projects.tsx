import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import SectionHeading from "@/components/SectionHeading";

export const projects = [
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

const Projects = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="inline-block mb-4 font-mono text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors">← back</button>
          <SectionHeading label="Work" title="All Projects" />
          <div className="space-y-1">
            {projects.map((project) => (
              <ProjectCard key={project.title} {...project} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Projects;
