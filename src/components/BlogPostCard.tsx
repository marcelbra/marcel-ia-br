interface BlogPostCardProps {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
}

const BlogPostCard = ({ title, excerpt, date, slug }: BlogPostCardProps) => {
  return (
    <article className="group block py-5 border-b border-border last:border-b-0 line-accent">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="font-display font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer">
          {title}
        </h3>
        <time className="font-mono text-xs text-muted-foreground shrink-0">{date}</time>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {excerpt}
      </p>
    </article>
  );
};

export default BlogPostCard;
