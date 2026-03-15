import { useRef, useState, useCallback, useEffect } from "react";
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
  asciiLogo: string;
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
}

const entries: Education[] = [
  {
    asciiLogo: "",
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
      { prefix: "Thesis: \"", text: "Problem decomposition in language modeling using chain-of-experts", link: "https://github.com/marcelbra/Papers/blob/main/problem_decomp_in_llms.pdf", suffix: "\"" },
      "Grade 1.0",
    ],
  },
  {
    asciiLogo: "",
    logo: tumLogo,
    title: "M.Sc. Data Engineering and Analytics",
    institution: "TU Munich",
    period: "Nov 2020 — Aug 2024",
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
    asciiLogo: "",
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
    asciiLogo: "",
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
      { prefix: "Thesis: \"", text: "Context in Information Retrieval", link: "https://github.com/marcelbra/Papers/blob/main/01_context_in_information_retrieval.pdf", suffix: "\" (grade: 1.3 / 4)" },
      "Early Specialization in ML and DL for NLP, minor in linguistics",
      "Programming tutor across 3 semesters, supervising 6 classes",
    ],
  },
];

const AcademicsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastScrollTime = useRef(0);

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(entries.length - 1, index));
    if (clamped === currentIndex) return;
    setCurrentIndex(clamped);
    const container = containerRef.current;
    if (!container) return;
    lastScrollTime.current = Date.now();
    container.children[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Date.now() - lastScrollTime.current < 700) return;
      if (Math.abs(e.deltaY) < 5) return;
      scrollToIndex(currentIndex + (e.deltaY > 0 ? 1 : -1));
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (Date.now() - lastScrollTime.current < 700) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 30) return;
      scrollToIndex(currentIndex + (diff > 0 ? 1 : -1));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentIndex, scrollToIndex]);

  return (
    <div ref={containerRef} className="h-full overflow-hidden">
      {entries.map((entry, i) => (
        <div key={i} className="h-full flex flex-col justify-center px-6">
          <div className="max-w-3xl mx-auto w-full">
            <div className={`flex items-center ${entry.logoImage ? 'gap-10' : 'gap-4'} mb-6`}>
              <img src={entry.logo} alt={`${entry.institution} logo`} className="w-14 h-14 object-contain pointer-events-none" style={{ transform: `scale(${entry.logoScale ?? 1}) translateY(${entry.logoOffset ?? 0}px)`, marginLeft: entry.logoMarginLeft ?? undefined }} />
              <div>
                {entry.asciiLogo ? (
                  <pre className={`${entry.color} text-[8px] leading-[1.15] tracking-[0.02em] font-bold hidden md:block`} aria-hidden="true">
                    {entry.asciiLogo}
                  </pre>
                ) : null}
                <span className={`${entry.color} text-2xl font-bold tracking-widest md:hidden`}>{entry.institution}</span>
              </div>
            </div>

            <div className="mt-2 mb-4 text-muted-foreground">
              <span className={entry.color}>$</span> {entry.command ?? "cat degree.txt"}
            </div>

            <div className={`border ${entry.borderColor} rounded bg-card/50 p-5`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h3 className="text-foreground font-medium text-lg">
                  {entry.title} <span className={entry.color}>@ {entry.institution}</span>
                </h3>
                <span className="text-xs text-muted-foreground font-mono px-2 py-1 border border-border rounded bg-background">
                  {entry.period}
                </span>
              </div>
              <ul className="space-y-2">
                {entry.bullets.map((bullet, j) => {
                  const prefix = typeof bullet === "string" ? undefined : bullet.prefix;
                  const text = typeof bullet === "string" ? bullet : bullet.text;
                  const link = typeof bullet === "string" ? undefined : bullet.link;
                  const suffix = typeof bullet === "string" ? undefined : bullet.suffix;
                  return (
                    <li key={j} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-ansi-yellow shrink-0">›</span>
                      {link ? (
                        <span>
                          {prefix}<a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline underline-offset-2 transition-colors">{text}</a>{suffix}
                        </span>
                      ) : (
                        <span className="whitespace-pre-line">{text}{suffix && <span className="text-lg leading-none">{suffix}</span>}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AcademicsSection;
