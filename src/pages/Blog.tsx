import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogPostCard from "@/components/BlogPostCard";
import SectionHeading from "@/components/SectionHeading";

export const posts = [
  {
    title: "On building things that last",
    excerpt: "Why I've started caring less about trends and more about longevity in software.",
    date: "Mar 2026",
    slug: "building-things-that-last",
  },
  {
    title: "The case for boring technology",
    excerpt: "Sometimes the best stack is the one nobody writes blog posts about.",
    date: "Jan 2026",
    slug: "boring-technology",
  },
  {
    title: "Designing for yourself first",
    excerpt: "How personal projects taught me more than any client work ever did.",
    date: "Nov 2025",
    slug: "designing-for-yourself",
  },
  {
    title: "Why I left my job to build in public",
    excerpt: "The scariest and most rewarding decision I've made in my career so far.",
    date: "Sep 2025",
    slug: "building-in-public",
  },
  {
    title: "A love letter to the terminal",
    excerpt: "Why I keep coming back to the command line after all these years.",
    date: "Jul 2025",
    slug: "love-letter-terminal",
  },
];

const Blog = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="inline-block mb-4 font-mono text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors">← back</button>
          <SectionHeading label="Writing" title="All Posts" />
          <div>
            {posts.map((post) => (
              <BlogPostCard key={post.slug} {...post} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
