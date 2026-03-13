import { useRef } from "react";

interface Experience {
  asciiLogo: string;
  title: string;
  company: string;
  period: string;
  bullets: string[];
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
    bullets: [
      "Building and deploying ML models for network optimization",
      "Developing real-time anomaly detection pipelines at scale",
      "Collaborating with cross-functional teams on AI-driven products",
      "Improving model inference latency by 3x through optimization",
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
            <pre className="text-ansi-green text-[10px] leading-[1.15] tracking-[0.02em] font-bold mb-6 hidden md:block" aria-hidden="true">
              {exp.asciiLogo}
            </pre>
            <span className="text-ansi-green text-2xl font-bold tracking-widest md:hidden">{exp.company}</span>

            <div className="mt-2 mb-4 text-muted-foreground">
              <span className="text-ansi-green">$</span> cat role.txt
            </div>

            <div className="border border-border rounded bg-card/50 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-foreground font-medium text-lg">{exp.title}</h3>
                  <p className="text-ansi-green text-sm">@ {exp.company}</p>
                </div>
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
