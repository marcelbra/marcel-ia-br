import { useRef } from "react";

interface Experience {
  logo: string;
  title: string;
  company: string;
  period: string;
  bullets: string[];
}

const experiences: Experience[] = [
  {
    logo: "◆",
    title: "Senior Frontend Engineer",
    company: "Nexus Technologies",
    period: "2024 — Present",
    bullets: [
      "Led migration from legacy jQuery codebase to React + TypeScript",
      "Built design system used across 4 product teams",
      "Reduced bundle size by 42% through code splitting and lazy loading",
      "Mentored 3 junior developers through onboarding program",
    ],
  },
  {
    logo: "▲",
    title: "Full-Stack Developer",
    company: "Vertex Labs",
    period: "2022 — 2024",
    bullets: [
      "Shipped real-time collaboration features using WebSockets",
      "Designed and implemented REST API serving 50k+ daily requests",
      "Introduced CI/CD pipelines reducing deploy time from 45min to 8min",
      "Built internal analytics dashboard with D3.js visualizations",
    ],
  },
  {
    logo: "●",
    title: "Frontend Developer",
    company: "Cascade Digital",
    period: "2020 — 2022",
    bullets: [
      "Developed responsive web applications for enterprise clients",
      "Implemented accessibility improvements achieving WCAG 2.1 AA",
      "Created component library reducing development time by 30%",
    ],
  },
  {
    logo: "■",
    title: "Junior Developer",
    company: "Pixel Forge Studio",
    period: "2018 — 2020",
    bullets: [
      "Built marketing sites and landing pages for startup clients",
      "Learned React, Node.js, and PostgreSQL on the job",
      "Contributed to open-source design tools used by 2k+ developers",
    ],
  },
];

const CvSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-auto">
      {/* Title slide */}
      <div className="snap-start h-full flex flex-col justify-center px-6">
        <div className="max-w-3xl mx-auto w-full">
          <pre className="text-ansi-yellow text-[10px] leading-[1.15] tracking-[0.02em] font-bold mb-6 hidden md:block" aria-hidden="true">{`
 ██████╗██╗   ██╗
██╔════╝██║   ██║
██║     ██║   ██║
██║     ╚██╗ ██╔╝
╚██████╗ ╚████╔╝ 
 ╚═════╝  ╚═══╝  `.trim()}</pre>
          <span className="text-ansi-yellow text-2xl font-bold tracking-widest md:hidden">CV</span>

          <div className="mt-4 text-muted-foreground">
            <span className="text-ansi-green">$</span> cat experience.log
          </div>
          <p className="text-foreground mt-2 text-sm">
            {experiences.length} entries found. Scroll to browse ↓
          </p>
        </div>
      </div>

      {/* Experience slides */}
      {experiences.map((exp, i) => (
        <div key={i} className="snap-start h-full flex flex-col justify-center px-6">
          <div className="max-w-3xl mx-auto w-full">
            {/* Connector line from previous */}
            <div className="flex items-stretch gap-4">
              {/* Timeline rail */}
              <div className="flex flex-col items-center shrink-0 w-8">
                {/* Line above */}
                <div className={`w-px flex-1 ${i === 0 ? 'bg-transparent' : 'bg-border'}`} />
                {/* Logo node */}
                <div className="w-8 h-8 rounded border border-border bg-card flex items-center justify-center text-ansi-yellow text-sm shrink-0">
                  {exp.logo}
                </div>
                {/* Line below */}
                <div className={`w-px flex-1 ${i === experiences.length - 1 ? 'bg-transparent' : 'bg-border'}`} />
              </div>

              {/* Content */}
              <div className="flex-1 py-2">
                <div className="border border-border rounded bg-card/50 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-foreground font-medium">{exp.title}</h3>
                      <p className="text-ansi-blue text-sm">{exp.company}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 border border-border rounded bg-background">
                      {exp.period}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-ansi-green shrink-0">›</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CvSection;
