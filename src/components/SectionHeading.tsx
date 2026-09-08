interface SectionHeadingProps {
  label: string;
  title: string;
}

const SectionHeading = ({ label, title }: SectionHeadingProps) => {
  return (
    <div className="mb-6 flat:mb-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-ansi-green">$</span>
        <span className="text-muted-foreground">ls</span>
        <span className="text-ansi-cyan">~/{label.toLowerCase()}</span>
      </div>
      <div className="border-b border-border pb-2">
        <h2 className="text-foreground font-semibold">{title}</h2>
      </div>
    </div>
  );
};

export default SectionHeading;
