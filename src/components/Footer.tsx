const Footer = () => {
  return (
    <footer className="border-t border-border py-8 px-6 mt-20">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()}
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          Built with care
        </p>
      </div>
    </footer>
  );
};

export default Footer;
