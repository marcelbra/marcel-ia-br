import { useRef, useState, useCallback, useEffect, lazy, Suspense } from "react";

const CvWheel = lazy(() => import("./CvWheel"));

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
      "ML models for network optimization",
      "Real-time anomaly detection at scale",
      "Cross-functional AI product development",
      "3x model inference latency improvement",
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
      "Built AI products from zero to launch",
      "End-to-end NLU pipelines",
      "Technical architecture for scalable AI",
      "Production models serving thousands daily",
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
      "Enterprise ML solutions deployment",
      "NLP pipelines for doc classification",
      "Model performance monitoring dashboards",
      "Mentored junior engineers on ML practices",
    ],
  },
];

const CvSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const isScrolling = useRef(false);
  const wheelEndTimer = useRef<ReturnType<typeof setTimeout>>();

  const scrollToIndex = useCallback((index: number): boolean => {
    const clamped = Math.max(0, Math.min(experiences.length - 1, index));
    if (clamped === currentIndexRef.current) return false;
    currentIndexRef.current = clamped;
    setCurrentIndex(clamped);
    const container = containerRef.current;
    if (!container) return false;
    container.children[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 5) return;

      // Reset the end-of-gesture timer on every wheel event
      clearTimeout(wheelEndTimer.current);
      wheelEndTimer.current = setTimeout(() => {
        isScrolling.current = false;
      }, 200);

      // Only advance once per gesture
      if (isScrolling.current) return;
      const didScroll = scrollToIndex(currentIndexRef.current + (e.deltaY > 0 ? 1 : -1));
      if (didScroll) isScrolling.current = true;
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling.current) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 30) return;
      isScrolling.current = true;
      setTimeout(() => { isScrolling.current = false; }, 700);
      scrollToIndex(currentIndexRef.current + (diff > 0 ? 1 : -1));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      clearTimeout(wheelEndTimer.current);
    };
  }, [scrollToIndex]);

  return (
    <div ref={containerRef} className="h-full overflow-hidden flex">
      {/* Left: experience cards */}
      <div className="flex-1 h-full">
        {experiences.map((exp, i) => (
          <div key={i} className="h-full flex flex-col justify-center px-6">
            <div className="max-w-2xl mx-auto w-full">
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

      {/* Right: 3D wheel */}
      <div className="hidden md:flex w-48 h-full items-center justify-center" style={{ minHeight: '300px' }}>
        <Suspense fallback={null}>
          <CvWheel currentIndex={currentIndex} />
        </Suspense>
      </div>
    </div>
  );
};

export default CvSection;
