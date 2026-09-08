import avatar1 from "@/assets/avatar1.png";
import avatar2 from "@/assets/avatar2.png";
import avatar3 from "@/assets/avatar3.png";
import avatar4 from "@/assets/avatar4.png";
import { useCallback, useEffect, useRef, useState } from "react";
import { clampToLines, hideAvatar, useFittingHero } from "@/hooks/use-fitting-hero";

const ALIEN_GLYPHS = "⟁⟐⟒⟓⟔⟗⟘⟙⟚⟛⟜⟝⟞⟟⏃⏁⏂⏣⏥⏦⎔⎊⏍▞▚◈◇◆⬡⬢⟠";

const AVATAR_FRAMES = [avatar1, avatar2, avatar3, avatar4];
const AVATAR_FRAME_MS = 250;
const AVATAR_HOLD_MS = 5000;
// Long enough that the greeting reads as the page settling rather than as
// something that came with the load, short enough to still be seen.
const AVATAR_GREETING_MS = 3500;

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
  // On a screen with no room for all of the hero, the avatar goes first and
  // the bio then gives up a line at a time, so that the links under it — the
  // only thing here anyone has to reach — stay on the screen.
  const blockRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const fit = useFittingHero(() => ({
    block: blockRef.current,
    row: rowRef.current,
    banner: welcomeRef.current,
    bio: bioRef.current,
  }));
  const [frameIndex, setFrameIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);

  const stopTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (holdRef.current) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
  }, []);

  // The whole cycle runs to completion on a single hover: play the frames
  // forward, hold the last one with the bubble, then play back to idle. The
  // pointer is free to leave at any point.
  const handleWelcomeEnter = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    stopTimers();
    setShowBubble(false);
    setFrameIndex(0);

    const rewind = () => {
      let i = AVATAR_FRAMES.length - 1;
      intervalRef.current = setInterval(() => {
        i--;
        if (i <= 0) {
          stopTimers();
          setFrameIndex(0);
          playingRef.current = false;
          return;
        }
        setFrameIndex(i);
      }, AVATAR_FRAME_MS);
    };

    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= AVATAR_FRAMES.length - 1) {
        stopTimers();
        setFrameIndex(AVATAR_FRAMES.length - 1);
        setShowBubble(true);
        holdRef.current = setTimeout(() => {
          setShowBubble(false);
          rewind();
        }, AVATAR_HOLD_MS);
        return;
      }
      setFrameIndex(i);
    }, AVATAR_FRAME_MS);
  }, [stopTimers]);

  // He waves once on his own, so the greeting is not something you have to
  // find by hovering — on a phone there is no hover to find it with.
  useEffect(() => {
    const greeting = setTimeout(handleWelcomeEnter, AVATAR_GREETING_MS);
    return () => clearTimeout(greeting);
  }, [handleWelcomeEnter]);

  useEffect(() => stopTimers, [stopTimers]);

  return (
    <section className="max-w-3xl mx-auto w-full hero-scope">
      <div ref={blockRef}>
        {/* Sized against the terminal window via container queries (see .hero-scope
            in index.css), so dragging the window's edge and resizing the browser do
            the same thing. The banner scales continuously; the avatar holds one size
            and disappears outright rather than shrinking, taking the row's reserved
            height with it (.hero-banner-row). The negative margin offsets the ~15%
            transparent padding under the feet, keeping them on the baseline. */}
        <div
          ref={rowRef}
          style={{ minHeight: fit.avatar ? undefined : 0 }}
          className="hero-banner-row mb-8 flex items-end gap-6"
          aria-hidden="true"
        >
          <pre
            ref={welcomeRef}
            onMouseEnter={handleWelcomeEnter}
            className="hero-banner text-hoodie-blue leading-[1.15] tracking-[0.02em] font-bold cursor-default"
          >{`
██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗
██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝
██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗  
██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝  
╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗
 ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
          `.trim()}</pre>
          <div style={hideAvatar(fit.avatar)} className="hero-avatar relative">
            <img
              src={AVATAR_FRAMES[frameIndex]}
              alt="Marcel Braasch pixel avatar"
              className="h-[10.14rem] w-auto mb-[-1.22rem] cursor-default"
              onMouseEnter={handleWelcomeEnter}
            />
            {showBubble && (
              // To the left of the avatar, where there is always room: the avatar
              // sits at the end of the row, so a bubble on its right hangs off the
              // window edge and a phone never sees it. The tail follows it over.
              <div className="absolute -top-3 right-full mr-2 z-10 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-xl rounded-br-none border-2 border-hoodie-blue shadow-[0_2px_12px_rgba(255,255,255,0.15)] whitespace-nowrap animate-fade-in">
                Hey there!
              </div>
            )}
          </div>
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
          <span className="cursor-default" onMouseEnter={() => { roleScramble(); handleWelcomeEnter(); }} onMouseLeave={() => roleUnscramble()}>{roleDisplay}</span>
        </p>
        <p
          ref={bioRef}
          style={clampToLines(fit.lines)}
          className="text-muted-foreground mb-6 max-w-2xl"
        >
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
