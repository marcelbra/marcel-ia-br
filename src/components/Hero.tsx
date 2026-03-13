const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-sm text-muted-foreground mb-4 tracking-wide">
          Hey, I'm
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          <span className="text-foreground">John</span>{" "}
          <span className="text-gradient">Doe</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
          A developer & designer crafting thoughtful digital experiences. 
          Currently building tools that make the web feel more human.
        </p>
        <div className="mt-8 flex items-center gap-6">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors">
            GitHub ↗
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors">
            Twitter ↗
          </a>
          <a href="mailto:hello@example.com" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors">
            Email ↗
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
