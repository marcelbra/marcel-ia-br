import { useRef, useState, useCallback, useEffect } from "react";
import kpnLogo from "@/assets/kpn-logo.png";
import newtoneLogo from "@/assets/newtone-logo.png";
import eraneosLogo from "@/assets/eraneos-logo.png";

type IconName = "stack" | "star" | "impact" | "build" | "agent" | "collab" | "scale";

const PixelIcon = ({ name, className = "" }: { name: IconName; className?: string }) => {
  const icons: Record<IconName, JSX.Element> = {
    stack: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L1 5l7 4 7-4-7-4z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <path d="M1 8l7 4 7-4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <path d="M1 11l7 4 7-4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
    star: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M8 1l2.1 4.3 4.9.7-3.5 3.4.8 4.6L8 11.8 3.7 14l.8-4.6L1 6l4.9-.7L8 1z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
    impact: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M2 14L14 2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7 2h7v7" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
    build: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <rect x="9" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <rect x="9" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
    agent: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <circle cx="6" cy="5" r="0.8" fill="currentColor"/>
        <circle cx="10" cy="5" r="0.8" fill="currentColor"/>
        <path d="M6 7.5c0 1.1.9 2 2 2s2-.9 2-2" stroke="currentColor" strokeWidth="0.8" fill="none"/>
        <line x1="8" y1="1.5" x2="8" y2="0" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="8" cy="0" r="0.6" fill="currentColor"/>
      </svg>
    ),
    collab: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <circle cx="11" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <path d="M0 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <path d="M6 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
    scale: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <line x1="1" y1="14" x2="1" y2="1" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M3 11V8h2v3H3zM7 11V5h2v6H7zM11 11V3h2v8h-2z" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  };
  return <span className={`shrink-0 opacity-60 ${className}`}>{icons[name]}</span>;
};

interface BulletItem {
  icon: IconName;
  text: string;
}

interface Experience {
  asciiLogo: string;
  logo: string;
  title: string;
  company: string;
  period: string;
  bullets: BulletItem[];
  color: string;
  borderColor: string;
  logoScale?: number;
  logoOffset?: number;
  command?: string;
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
    logo: kpnLogo,
    title: "Machine Learning Engineer",
    company: "Royal KPN N.V.",
    period: "Sep 2025 — Present",
    color: "text-ansi-green",
    borderColor: "border-ansi-green/30",
    command: "cat cv/role-1.txt",
    bullets: [
      { icon: "stack", text: "Stack: Python (Semantic Kernel, Pydantic, FastAPI), OpenAI API, MS Azure, MCP, ElevenLabs" },
      { icon: "impact", text: "Lead engineer building agent eval capabilities reducing time-to-prod from months to weeks" },
      { icon: "star", text: "Part of project's SteerCo, recognized as go-to expert on evals, driving practices through the org" },
      { icon: "build", text: "Owner and and maintainer of one agent in KPN's voice-based multi-agent system live on prod" },
      { icon: "collab", text: "Building use-cases in sub-teams, driving streamlined evaluation across cross use-case" },
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
    logo: newtoneLogo,
    title: "Founding AI Engineer",
    company: "Newtone SAS",
    period: "Feb 2025 — Sep 2025",
    color: "text-ansi-magenta",
    borderColor: "border-ansi-magenta/30",
    command: "cat cv/role-2.txt",
    bullets: [
      { icon: "stack", text: "Stack: Python (LangGraph, LangChain, LangSmith, FastAPI), Claude/OpenAI/Gemini, PostgreSQL, GCP" },
      { icon: "build", text: "Built the core agent capabilities (generate, edit, translate content; manage and update context)" },
      { icon: "impact", text: "Drove MRR from 50K to 100K in a frame of 4 months within a team of 5" },
      { icon: "agent", text: "Built a multimodal agentic solution to turn images, specs, brand guidelines into product content" },
      { icon: "collab", text: "Engaged with customers daily to gather feedback iterating on the solution in real-time" },
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
    logo: eraneosLogo,
    title: "AI Engineer",
    company: "Eraneos Analytics Germany",
    period: "Jan 2023 — Feb 2025",
    color: "text-ansi-blue",
    borderColor: "border-ansi-blue/30",
    command: "cat cv/role-3.txt",
    logoScale: 1.5,
    logoOffset: 4,
    bullets: [
      { icon: "stack", text: "Stack: Python (LangChain, FastAPI), OpenAI API, Docker, PostgreSQL, RabbitMQ, GCP, Azure" },
      { icon: "star", text: "Built LLM-based customer feedback software at Deutsche Telekom AG for 1.5 years" },
      { icon: "scale", text: "Scaled app to real-time access: 10M+ feedbacks, 30M+ related entities, 10K new daily data points" },
      { icon: "impact", text: "Member of core engineering team at Convalid, worked in team of 8, acquired by Eraneos" },
      { icon: "collab", text: "Daily customer touchpoints; deriving business requirements and shipping features" },
    ],
  },
];

const CvSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const lockedUntilRef = useRef(0);

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(experiences.length - 1, index));
    if (clamped === currentIndexRef.current) return;
    currentIndexRef.current = clamped;
    setCurrentIndex(clamped);
    const container = containerRef.current;
    if (!container) return;
    container.children[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
    lockedUntilRef.current = Date.now() + 1200;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Date.now() < lockedUntilRef.current) return;
      if (Math.abs(e.deltaY) < 5) return;
      scrollToIndex(currentIndexRef.current + (e.deltaY > 0 ? 1 : -1));
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (Date.now() < lockedUntilRef.current) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 30) return;
      scrollToIndex(currentIndexRef.current + (diff > 0 ? 1 : -1));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollToIndex]);

  return (
    <div ref={containerRef} className="h-full overflow-hidden">
      {experiences.map((exp, i) => (
        <div key={i} className="h-full flex flex-col justify-center px-6">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-4 mb-6">
              <img src={exp.logo} alt={`${exp.company} logo`} className="w-14 h-14 object-contain" style={{ transform: `scale(${exp.logoScale ?? 1}) translateY(${exp.logoOffset ?? 0}px)` }} />
              <div>
                <pre
                  className={`${exp.color} text-[8px] leading-[1.15] tracking-[0.02em] font-bold hidden md:block cursor-pointer`}
                  aria-hidden="true"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }}
                  onCopy={(e) => {
                    e.preventDefault();
                    e.clipboardData.setData("text/plain", exp.company);
                  }}
                >
                  {exp.asciiLogo}
                </pre>
                <span className={`${exp.color} text-2xl font-bold tracking-widest md:hidden`}>{exp.company}</span>
              </div>
            </div>

            <div className="mt-2 mb-4 text-muted-foreground">
              <span className={exp.color}>$</span> {exp.command ?? "cat role.txt"}
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
                  <li key={j} className="text-[12px] text-muted-foreground flex items-start gap-2">
                    <PixelIcon name={bullet.icon} className={bullet.icon === "stack" ? "mt-[2px]" : "mt-[3px]"} />
                    <span>{bullet.text}</span>
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
