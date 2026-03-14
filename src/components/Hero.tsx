import avatar1 from "@/assets/avatar1.png";
import avatar2 from "@/assets/avatar2.png";
import avatar3 from "@/assets/avatar3.png";
import avatar4 from "@/assets/avatar4.png";
import { useCallback, useEffect, useRef, useState } from "react";

const STAR_COLOR = "#fabd2f";

function spawnShootingStar(originEl: HTMLElement) {
  const rect = originEl.getBoundingClientRect();
  const x = rect.left + Math.random() * rect.width;
  const y = rect.top + Math.random() * rect.height;

  const angle = Math.random() * Math.PI * 2;
  const speed = 120 + Math.random() * 100; // px per sec
  const color = STAR_COLOR;

  const star = document.createElement("div");
  star.style.position = "fixed";
  star.style.left = `${x}px`;
  star.style.top = `${y}px`;
  star.style.width = "4px";
  star.style.height = "4px";
  star.style.background = color;
  star.style.boxShadow = `0 0 6px ${color}, 0 0 2px ${color}`;
  star.style.imageRendering = "pixelated";
  star.style.pointerEvents = "none";
  star.style.zIndex = "9999";
  document.body.appendChild(star);

  const dx = Math.cos(angle) * speed;
  const dy = Math.sin(angle) * speed;
  let startTime: number | null = null;

  function tick(time: number) {
    if (!startTime) startTime = time;
    const elapsed = (time - startTime) / 1000;
    if (elapsed > 3) {
      star.remove();
      return;
    }
    const opacity = Math.max(0, 1 - elapsed / 3);
    star.style.left = `${x + dx * elapsed}px`;
    star.style.top = `${y + dy * elapsed}px`;
    star.style.opacity = String(opacity);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const Hero = () => {
  const nameRef = useRef<HTMLSpanElement>(null);

  const handleHover = useCallback(() => {
    if (nameRef.current) {
      for (let i = 0; i < 10; i++) spawnShootingStar(nameRef.current);
    }
  }, []);

  return (
    <section className="max-w-3xl mx-auto w-full">
      <div>
        <div className="mb-8 hidden md:flex items-end gap-6" aria-hidden="true">
          <pre className="text-ansi-yellow text-[10px] leading-[1.15] tracking-[0.02em] font-bold">{`
██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗
██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝
██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗  
██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝  
╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗
 ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
          `.trim()}</pre>
          <img src={avatar} alt="Marcel Braasch pixel avatar" className="h-[10.14rem] w-auto mb-[-1rem]" />
        </div>
        <div className="mb-8 md:hidden flex items-center gap-4" aria-hidden="true">
          <span className="text-ansi-yellow text-2xl font-bold tracking-widest">JDOE</span>
          <img src={avatar} alt="Marcel Braasch pixel avatar" className="h-16 w-auto" />
        </div>

        <div className="text-muted-foreground mb-6">
          <span className="text-ansi-green">$</span> whoami
        </div>
        
        <p className="text-foreground mb-4">
          <span className="text-ansi-yellow">name</span>
          <span className="text-muted-foreground">:</span>{" "}
          <span
            ref={nameRef}
            onMouseEnter={handleHover}
            className="cursor-default"
          >
            marcel braasch
          </span>
        </p>
        <p className="text-foreground mb-4">
          <span className="text-ansi-yellow">role</span>
          <span className="text-muted-foreground">:</span> ai and software engineer
        </p>
        <p className="text-muted-foreground mb-6 max-w-lg">
          <span className="text-ansi-yellow">bio</span>
          <span className="text-muted-foreground">:</span>{" "}
          <span className="text-foreground">
            crafting thoughtful digital experiences. building tools that make the web feel more human.
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-ansi-blue hover:underline">
            [github]
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-ansi-cyan hover:underline">
            [twitter]
          </a>
          <a href="mailto:hello@example.com" className="text-ansi-red hover:underline">
            [email]
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
