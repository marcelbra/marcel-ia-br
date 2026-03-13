const Footer = () => {
  return (
    <footer className="border-t border-border py-6 px-6 mt-16">
      <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className="text-ansi-green">$</span> echo © {new Date().getFullYear()}
        </span>
        <span>
          <span className="text-ansi-blue">[EOF]</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
