interface WritingPostCardProps {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
}

const WritingPostCard = ({ title, excerpt, date, slug }: WritingPostCardProps) => {
  return (
    <article className="group py-3 border-b border-border hover:bg-secondary/30 -mx-3 px-3 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="text-foreground">
          <span className="text-ansi-red">#</span>{" "}
          <span className="group-hover:text-ansi-yellow transition-colors">{title}</span>
        </h3>
        <time className="text-xs text-muted-foreground shrink-0">{date}</time>
      </div>
      {/* Flat, a post is its title and its date: the line under it is the
          first thing worth the height it costs. */}
      <p className="text-sm text-muted-foreground pl-4 flat:hidden">
        {excerpt}
      </p>
    </article>
  );
};

export default WritingPostCard;
