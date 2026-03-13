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
      className="group block p-5 -mx-5 rounded-lg hover:bg-secondary/50 transition-colors duration-300 line-accent"
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-display font-medium text-foreground group-hover:text-primary transition-colors">
          {title}
          <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
        </h3>
        <span className="font-mono text-xs text-muted-foreground shrink-0">{year}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {description}
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
};

export default ProjectCard;
