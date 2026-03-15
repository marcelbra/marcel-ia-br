import avatar1 from "@/assets/avatar1.png";
import avatar2 from "@/assets/avatar2.png";
import avatar3 from "@/assets/avatar3.png";
import avatar4 from "@/assets/avatar4.png";
import { useCallback, useEffect, useRef, useState } from "react";

const ALIEN_GLYPHS = "⟁⟐⟒⟓⟔⟗⟘⟙⟚⟛⟜⟝⟞⟟⏃⏁⏂⏣⏥⏦⎔⎊⏍▞▚◈◇◆⬡⬢⟠";

const useAlienText = (text: string) => {
  const [display, setDisplay] = useState(text);
  const hoveringRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Ambient random tweaks
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((ch) => {
            if (ch === " ") return " ";
            return Math.random() < 0.04 ? ALIEN_GLYPHS[Math.floor(Math.random() * ALIEN_GLYPHS.length)] : ch;
          })
          .join("")
      );
    }, 250);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [text]);

  const scramble = useCallback(() => {
    hoveringRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    let tick = 0;
    intervalRef.current = setInterval(() => {
      tick++;
      setDisplay(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (tick > 6 + i) {
              return Math.random() < 0.04 ? ALIEN_GLYPHS[Math.floor(Math.random() * ALIEN_GLYPHS.length)] : ch;
            }
            return ALIEN_GLYPHS[Math.floor(Math.random() * ALIEN_GLYPHS.length)];
          })
          .join("")
      );
    }, 50);
  }, [text]);

  const unscramble = useCallback(() => {
    hoveringRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Resume ambient tweaks
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((ch) => {
            if (ch === " ") return " ";
            return Math.random() < 0.04 ? ALIEN_GLYPHS[Math.floor(Math.random() * ALIEN_GLYPHS.length)] : ch;
          })
          .join("")
      );
    }, 250);
  }, [text]);

  return { display, scramble, unscramble };
};

const WORLD_SCRIPTS = [
  "マルセル ブラーシュ",
  "مارسل براش",
  "марсель брааш",
  "마르셀 브라쉬",
  "मार्सेल ब्राश",
  "馬塞爾 布拉許",
  "マルセル ブラーシュ",
];

const useScriptHop = (text: string) => {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let tick = 0;
    intervalRef.current = setInterval(() => {
      if (tick < WORLD_SCRIPTS.length) {
        setDisplay(WORLD_SCRIPTS[tick]);
      } else {
        // Decode back letter by letter
        const decodeTick = tick - WORLD_SCRIPTS.length;
        const lastScript = WORLD_SCRIPTS[WORLD_SCRIPTS.length - 1];
        setDisplay(
          text
            .split("")
            .map((ch, i) => {
              if (i <= decodeTick) return ch;
              if (ch === " ") return " ";
              const fallback = lastScript[i % lastScript.length];
              return fallback === " " ? ch : fallback;
            })
            .join("")
        );
        if (decodeTick >= text.length) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setDisplay(text);
        }
      }
      tick++;
    }, 100);
  }, [text]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplay(text);
  }, [text]);

  return { display, hop, reset };
};

const Hero = () => {
  const { display: roleDisplay, scramble: roleScramble, unscramble: roleUnscramble } = useAlienText("ai and software engineer");
  const { display: nameDisplay, hop: nameHop, reset: nameReset } = useScriptHop("marcel braasch");
  const welcomeRef = useRef<HTMLPreElement>(null);
  const frames = [avatar1, avatar2, avatar3, avatar4];
  const [frameIndex, setFrameIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleWelcomeEnter = useCallback(() => {
    if (animRef.current) clearInterval(animRef.current);
    setShowBubble(false);
    let i = 0;
    setFrameIndex(0);
    animRef.current = setInterval(() => {
      i++;
      if (i >= frames.length) {
        if (animRef.current) clearInterval(animRef.current);
        animRef.current = null;
        setFrameIndex(frames.length - 1);
        setShowBubble(true);
        return;
      }
      setFrameIndex(i);
    }, 250);
  }, [frames.length]);

  const handleWelcomeLeave = useCallback(() => {
    setShowBubble(false);
    if (animRef.current) clearInterval(animRef.current);
    let i = frames.length - 1;
    animRef.current = setInterval(() => {
      i--;
      if (i < 0) {
        setFrameIndex(0);
        if (animRef.current) clearInterval(animRef.current);
        animRef.current = null;
        return;
      }
      setFrameIndex(i);
    }, 250);
  }, [frames.length]);

  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  return (
    <section className="max-w-3xl mx-auto w-full">
      <div>
        <div className="mb-8 hidden md:flex items-end gap-6" aria-hidden="true">
          <pre
            ref={welcomeRef}
            onMouseEnter={handleWelcomeEnter}
            onMouseLeave={handleWelcomeLeave}
            className="text-hoodie-blue text-[10px] leading-[1.15] tracking-[0.02em] font-bold cursor-default"
          >{`
██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗
██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝
██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗  
██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝  
╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗
 ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
          `.trim()}</pre>
          <div className="relative">
            <img src={frames[frameIndex]} alt="Marcel Braasch pixel avatar" className="h-[10.14rem] w-auto mb-[-2.5rem] cursor-default" onMouseEnter={handleWelcomeEnter} onMouseLeave={handleWelcomeLeave} />
            {showBubble && (
              <div className="absolute -top-3 -right-20 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-xl rounded-bl-none border-2 border-hoodie-blue shadow-[0_2px_12px_rgba(255,255,255,0.15)] whitespace-nowrap animate-fade-in">
                Hey there!
              </div>
            )}
          </div>
        </div>
        <div className="mb-8 md:hidden flex items-center gap-4" aria-hidden="true">
          <span className="text-ansi-yellow text-2xl font-bold tracking-widest">JDOE</span>
          <img src={frames[frameIndex]} alt="Marcel Braasch pixel avatar" className="h-16 w-auto" />
        </div>

        <div className="text-muted-foreground mb-6">
          <span className="text-hoodie-blue">$</span> whoami
        </div>

        <p className="text-foreground mb-4">
          <span className="text-hoodie-blue">name</span>
          <span className="text-muted-foreground">:</span>{" "}
          <span className="cursor-default">
            marcel braasch
          </span>
        </p>
        <p className="text-foreground mb-4">
          <span className="text-hoodie-blue">role</span>
          <span className="text-muted-foreground">:</span>{" "}
          <span className="cursor-default" onMouseEnter={() => { roleScramble(); handleWelcomeEnter(); }} onMouseLeave={() => { roleUnscramble(); handleWelcomeLeave(); }}>{roleDisplay}</span>
        </p>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          <span className="text-hoodie-blue">bio</span>
          <span className="text-muted-foreground">:</span>{" "}
          <span className="text-foreground">
            bridging deep ML, DS, and SE expertise with customer obsession. I thrive in fast‑paced environments and love solving hard problems that truly matter.
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <a href="https://github.com/marcelbra" target="_blank" rel="noopener noreferrer" className="text-foreground group">
            [<span className="group-hover:underline">github</span>]
          </a>
          <a href="https://www.linkedin.com/in/marcelbraasch/" target="_blank" rel="noopener noreferrer" className="text-ansi-blue group">
            [<span className="group-hover:underline">linkedin</span>]
          </a>
          <a href="mailto:marcelbraasch@gmail.com" className="text-ansi-red group">
            [<span className="group-hover:underline">email</span>]
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
