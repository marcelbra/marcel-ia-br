import { useRef, useState, useCallback, useEffect } from "react";
import EntryHeading from "@/components/EntryHeading";
import PagedBullets from "@/components/PagedBullets";
import { FIT_BOUNDARY } from "@/hooks/use-fitting-list";
import technicoLogo from "@/assets/technico-logo.png";
import goetheLogo from "@/assets/goethe-logo.png";
import lmuLogo from "@/assets/lmu-logo.png";
import tumLogo from "@/assets/tum-logo.png";

import ethLogo from "@/assets/eth-logo.png";

interface Bullet {
  prefix?: string;
  text: string;
  link?: string;
  suffix?: string;
}

interface Education {
  logo: string;
  title: string;
  institution: string;
  period: string;
  bullets: (string | Bullet)[];
  color: string;
  borderColor: string;
  logoScale?: number;
  logoOffset?: number;
  logoMarginLeft?: string;
  command?: string;
  periodInfo?: string;
  extraPeriod?: string;
  extraPeriodInfo?: string;
}

const entries: Education[] = [
  {
    logo: ethLogo,
    title: "Master's Thesis at ETH AI Center",
    institution: "ETH Zurich",
    period: "Mar 2024 — Aug 2024",
    color: "text-muted-foreground",
    borderColor: "border-muted-foreground/30",
    logoScale: 9,
    logoOffset: 0,
    logoMarginLeft: '9rem',
    command: "cat academics/masters-1.txt",
    bullets: [
      { prefix: "Thesis: \"", text: "Problem Decomposition in Language Modeling Using Chain-of-Experts", link: "https://github.com/marcelbra/Papers/blob/main/problem_decomp_in_llms.pdf", suffix: "\"" },
      "Grade 1.0",
    ],
  },
  {
    logo: tumLogo,
    title: "M.Sc. Data Engineering and Analytics",
    institution: "TU Munich",
    period: "Nov 2020 — Dec 2022",
    periodInfo: "Coursework concluded in parallel with completely finished LMU master's.",
    extraPeriod: "Mar 2024 — Aug 2024",
    extraPeriodInfo: "Return to academia to finish the outstanding thesis.",
    color: "text-[#0065bd]",
    borderColor: "border-[#0065bd]/30",
    logoScale: 7,
    logoMarginLeft: '7rem',
    command: "cat academics/masters-2.txt",
    bullets: [
      "Grade 1.7 — Top 5%",
      { text: "Exchange semester @ Tecnico Lisboa - now fluent in ", suffix: "🇧🇷" },
      "Focus: applied math and machine learning (40%), deep learning\nin NLP (40%), high\u2011performance computing (20%)",
    ],
  },
  {
    logo: lmuLogo,
    title: "M.Sc. Computational Linguistics",
    institution: "LMU Munich",
    period: "Nov 2020 — Dec 2022",
    color: "text-[#006f3b]",
    borderColor: "border-[#006f3b]/30",
    logoScale: 5,
    logoOffset: 0,
    logoMarginLeft: '5.5rem',
    command: "cat academics/masters-3.txt",
    bullets: [
      "Grade 1.4 — Top 5%",
      { prefix: "Thesis: \"", text: "Improving rare word representations in pre-trained language models", link: "https://github.com/marcelbra/Papers/blob/main/learning_rare_words_in_PLMs.pdf", suffix: "\"" },
      "Focus: language modeling (70%) and theoretical linguistics (30%)",
    ],
  },
  {
    logo: goetheLogo,
    title: "B.Sc. Computer Science",
    institution: "Goethe University Frankfurt",
    period: "Apr 2018 — Sep 2020",
    color: "text-ansi-blue",
    borderColor: "border-ansi-blue/30",
    logoScale: 7,
    logoMarginLeft: '7.5rem',
    command: "cat academics/bachelors.txt",
    bullets: [
      { prefix: "Thesis: \"", text: "Context in Information Retrieval", link: "https://github.com/marcelbra/Papers/blob/main/01_context_in_information_retrieval.pdf", suffix: "\" (grade: 1.3)" },
      "Programming tutor across 3 semesters, supervising 6 classes",
      "Early Specialization in ML and DL for NLP, minor in linguistics",
    ],
  },
];

const AcademicsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const lockedUntilRef = useRef(0);

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(entries.length - 1, index));
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    // The stack is scrolled by pixels, so a resize leaves the current entry off
    // its mark by however much the page height changed — and the entry next to
    // it shows through the gap. Snap back to the current page instead.
    const realign = () => {
      container.children[currentIndexRef.current]?.scrollIntoView({ block: "start" });
    };
    const observer = new ResizeObserver(realign);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full overflow-hidden">
      {entries.map((entry, i) => (
        <div key={i} {...{ [FIT_BOUNDARY]: true }} className="h-full flex flex-col overflow-hidden px-6 py-6">
          <div className="max-w-3xl w-full m-auto min-h-0 flex flex-col">
            <div className="flex items-center mb-6 shrink-0">
              <img src={entry.logo} alt={`${entry.institution} logo`} className="w-14 h-14 object-contain pointer-events-none" style={{ transform: `scale(${entry.logoScale ?? 1}) translateY(${entry.logoOffset ?? 0}px)`, marginLeft: entry.logoMarginLeft ?? undefined }} />
            </div>

            <div className="mt-2 mb-4 shrink-0 text-muted-foreground">
              <span className={entry.color}>$</span> {entry.command ?? "cat degree.txt"}
            </div>

            <div className={`border ${entry.borderColor} rounded bg-card/50 p-5 min-h-0 flex flex-col`}>
              <EntryHeading title={entry.title} at={entry.institution} color={entry.color} className="text-lg">
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-xs text-muted-foreground font-mono px-2 py-1 border border-border rounded bg-background relative ${entry.periodInfo ? 'group/main cursor-help' : ''}`}>
                    {entry.period}
                    {entry.periodInfo && (
                      <>
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-ansi-blue/20 text-[9px] text-ansi-blue/70 animate-pulse">i</span>
                        <span className="absolute right-0 top-full mt-1 w-48 p-2 text-xs bg-background border border-border rounded shadow-lg opacity-0 group-hover/main:opacity-100 transition-opacity pointer-events-none z-10">
                          {entry.periodInfo}
                        </span>
                      </>
                    )}
                  </span>
                  {entry.extraPeriod && (
                    <span className={`text-xs text-muted-foreground font-mono px-2 py-1 border border-border rounded bg-background relative ${entry.extraPeriodInfo ? 'group/extra cursor-help' : ''}`}>
                      {entry.extraPeriod}
                      {entry.extraPeriodInfo && (
                        <>
                          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-ansi-blue/20 text-[9px] text-ansi-blue/70 animate-pulse">i</span>
                          <span className="absolute right-0 top-full mt-1 w-48 p-2 text-xs bg-background border border-border rounded shadow-lg opacity-0 group-hover/extra:opacity-100 transition-opacity pointer-events-none z-10">
                            {entry.extraPeriodInfo}
                          </span>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </EntryHeading>
              <PagedBullets
                total={entry.bullets.length}
                color={entry.color}
                className="space-y-2"
                itemClassName="text-[12px] text-muted-foreground flex gap-2"
              >
                {(j) => {
                  const bullet = entry.bullets[j];
                  const prefix = typeof bullet === "string" ? undefined : bullet.prefix;
                  const text = typeof bullet === "string" ? bullet : bullet.text;
                  const link = typeof bullet === "string" ? undefined : bullet.link;
                  const suffix = typeof bullet === "string" ? undefined : bullet.suffix;
                  return (
                    <>
                      <span className="text-ansi-yellow shrink-0">›</span>
                      {link ? (
                        <span>
                          {prefix}<a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline underline-offset-2 transition-colors">{text}</a>{suffix}
                        </span>
                      ) : (
                        <span className="whitespace-pre-line">{text}{suffix && <span className="text-lg leading-none">{suffix}</span>}</span>
                      )}
                    </>
                  );
                }}
              </PagedBullets>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AcademicsSection;
