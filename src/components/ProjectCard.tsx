interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  link: string;
  year: string;
}

const ProjectCard = ({ title, description, tags, link, year }: ProjectCardProps) => {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block py-3 border-b border-border hover:bg-secondary/30 -mx-3 px-3 transition-colors"
    >
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="text-foreground">
          <span className="text-ansi-blue">→</span>{" "}
          <span className="group-hover:text-ansi-yellow transition-colors">{title}</span>
        </h3>
        <span className="text-xs text-muted-foreground shrink-0">{year}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-2 pl-4">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 pl-4">
        {tags.map((tag) => (
          <span key={tag} className="text-xs text-ansi-green">
            #{tag.toLowerCase().replace(/[\s.]/g, '')}
          </span>
        ))}
      </div>
    </a>
  );
};

export default ProjectCard;
