const Hero = () => {
  return (
    <section className="pt-28 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <pre className="text-ansi-blue text-xs mb-6 leading-relaxed hidden md:block" aria-hidden="true">{`
   ___  ____   ___  ____
  |_  ||  _ \\ / _ \\|  __|
    | || | | | | | | |__
    | || | | | | | |  __|
 |__| | |_| | |_| | |___
 |___ ||____/ \\___/|_____|
        `.trim()}</pre>
        
        <div className="text-muted-foreground mb-6">
          <span className="text-ansi-green">$</span> whoami
        </div>
        
        <p className="text-foreground mb-4">
          <span className="text-ansi-yellow">name</span>
          <span className="text-muted-foreground">:</span> John Doe
        </p>
        <p className="text-foreground mb-4">
          <span className="text-ansi-yellow">role</span>
          <span className="text-muted-foreground">:</span> developer & designer
        </p>
        <p className="text-muted-foreground mb-6 max-w-lg">
          <span className="text-ansi-yellow">bio</span>
          <span className="text-muted-foreground">:</span>{" "}
          <span className="text-foreground">
            Crafting thoughtful digital experiences. Building tools that make the web feel more human.
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
