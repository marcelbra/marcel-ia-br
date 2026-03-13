import { useRef, useState, useCallback, useEffect } from "react";

interface Experience {
  asciiLogo: string;
  title: string;
  company: string;
  period: string;
  bullets: string[];
  color: string; // tailwind text color class using ansi tokens
  borderColor: string;
}

const experiences: Experience[] = [
  {
    asciiLogo: `
██╗  ██╗██████╗ ███╗   ██╗
██║ ██╔╝██╔══██╗████╗  ██║
█████╔╝ ██████╔╝██╔██╗ ██║
██╔═██╗ ██╔═══╝ ██║╚██╗██║
██║  ██╗██║     ██║ ╚████║
╚═╝  ╚═╝╚═╝     ╚═╝  ╚═══╝`.trim(),
    title: "Machine Learning Engineer",
    company: "KPN",
    period: "Sep 2025 — Present",
    color: "text-ansi-green",
    borderColor: "border-ansi-green/30",
    bullets: [
      "Building and deploying ML models for network optimization",
      "Developing real-time anomaly detection pipelines at scale",
      "Collaborating with cross-functional teams on AI-driven products",
      "Improving model inference latency by 3x through optimization",
    ],
  },
  {
    asciiLogo: `
███╗   ██╗███████╗██╗    ██╗████████╗ ██████╗ ███╗   ██╗███████╗
████╗  ██║██╔════╝██║    ██║╚══██╔══╝██╔═══██╗████╗  ██║██╔════╝
██╔██╗ ██║█████╗  ██║ █╗ ██║   ██║   ██║   ██║██╔██╗ ██║█████╗  
██║╚██╗██║██╔══╝  ██║███╗██║   ██║   ██║   ██║██║╚██╗██║██╔══╝  
██║ ╚████║███████╗╚███╔███╔╝   ██║   ╚██████╔╝██║ ╚████║███████╗
╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝    ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝`.trim(),
    title: "Founding AI Engineer",
    company: "Newtone",
    period: "Jan 2024 — Aug 2025",
    color: "text-ansi-magenta",
    borderColor: "border-ansi-magenta/30",
    bullets: [
      "Co-founded and built AI-powered products from zero to launch",
      "Designed end-to-end ML pipelines for natural language understanding",
      "Led technical architecture decisions for scalable AI systems",
      "Shipped production models serving thousands of daily users",
    ],
  },
  {
    asciiLogo: `
███████╗██████╗  █████╗ ███╗   ██╗███████╗ ██████╗ ███████╗
██╔════╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔═══██╗██╔════╝
█████╗  ██████╔╝███████║██╔██╗ ██║█████╗  ██║   ██║███████╗
██╔══╝  ██╔══██╗██╔══██║██║╚██╗██║██╔══╝  ██║   ██║╚════██║
███████╗██║  ██║██║  ██║██║ ╚████║███████╗╚██████╔╝███████║
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝`.trim(),
    title: "AI Engineer",
    company: "Eraneos",
    period: "Jun 2022 — Dec 2023",
    color: "text-ansi-blue",
    borderColor: "border-ansi-blue/30",
    bullets: [
      "Developed and deployed machine learning solutions for enterprise clients",
      "Built NLP pipelines for document classification and extraction",
      "Created dashboards and tooling to monitor model performance",
      "Mentored junior engineers on ML best practices and workflows",
    ],
  },
];

const CvSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-auto">
      {experiences.map((exp, i) => (
        <div key={i} className="snap-start h-full flex flex-col justify-center px-6">
          <div className="max-w-3xl mx-auto w-full">
            {/* ASCII company logo */}
            <pre className={`${exp.color} text-[8px] leading-[1.15] tracking-[0.02em] font-bold mb-6 hidden md:block`} aria-hidden="true">
              {exp.asciiLogo}
            </pre>
            <span className={`${exp.color} text-2xl font-bold tracking-widest md:hidden`}>{exp.company}</span>

            <div className="mt-2 mb-4 text-muted-foreground">
              <span className={exp.color}>$</span> cat role.txt
            </div>

            <div className={`border ${exp.borderColor} rounded bg-card/50 p-5`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h3 className="text-foreground font-medium text-lg">
                  {exp.title} <span className={exp.color}>@ {exp.company}</span>
                </h3>
                <span className="text-xs text-muted-foreground font-mono px-2 py-1 border border-border rounded bg-background">
                  {exp.period}
                </span>
              </div>
              <ul className="space-y-2">
                {exp.bullets.map((bullet, j) => (
                  <li key={j} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-ansi-yellow shrink-0">›</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CvSection;
