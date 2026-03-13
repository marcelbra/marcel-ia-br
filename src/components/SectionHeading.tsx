interface SectionHeadingProps {
  label: string;
  title: string;
}

const SectionHeading = ({ label, title }: SectionHeadingProps) => {
  return (
    <div className="mb-8">
      <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">{label}</p>
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
    </div>
  );
};

export default SectionHeading;
