import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Footer from "@/features/landing/components/Footer";
import Header from "@/features/landing/components/Header";
import { formatDate, getPostBySlug } from "@/lib/blog";
import usePageMetadata from "@/hooks/usePageMetadata";

// Custom components for markdown rendering
const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-3xl font-bold tracking-tight mt-12 mb-6 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-2xl font-bold tracking-tight mt-10 mb-4">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xl font-bold tracking-tight mt-8 mb-3">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-foreground/90 leading-relaxed mb-6">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside space-y-2 mb-6 text-foreground/90">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside space-y-2 mb-6 text-foreground/90">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">
      {children}
    </a>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-foreground/80">{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary/30 pl-6 py-2 my-6 italic text-foreground/70 bg-surface/50 rounded-r-lg">
      {children}
    </blockquote>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-surface-2 px-1.5 py-0.5 rounded text-sm font-mono text-primary">
        {children}
      </code>
    ) : (
      <pre className="bg-surface-2 p-4 rounded-xl overflow-x-auto my-6">
        <code className={`${className} text-sm font-mono`}>{children}</code>
      </pre>
    );
  },
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-surface-2">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-border px-4 py-3 text-foreground/90">{children}</td>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img src={src} alt={alt} className="w-full rounded-2xl my-8 shadow-lg" />
  ),
};

const BlogArticlePage: React.FC = () => {
  const { slug } = useParams({ from: "/blog/$slug" });
  const shouldReduceMotion = useReducedMotion();

  const post = getPostBySlug(slug);

  usePageMetadata({
    title: post ? `${post.title} — MacroTrackr Blog` : "Blog — MacroTrackr",
    description: post?.excerpt || "Read the latest from MacroTrackr.",
    canonical: `https://macrotrackr.com/blog/${slug}`,
  });

  if (!post) {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="relative flex-1 z-10 mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight">Article Not Found</h1>
            <p className="text-muted text-lg mb-8">We couldn't find the post you were looking for.</p>
            <Link to="/blog" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90">
              Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getCategoryColor = () => {
    switch (post.category) {
      case "Releases":
        return "bg-primary/10 text-primary";
      case "Tips":
        return "bg-chart-2/10 text-chart-2";
      case "Nutrition Guides":
        return "bg-chart-4/10 text-chart-4";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div
      className={`relative min-h-screen bg-background text-foreground ${shouldReduceMotion ? "" : "scroll-smooth"}`}
    >
      <Header />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            to="/blog"
            className="group mb-12 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-surface/50 px-4 py-2 text-sm font-medium text-muted transition-all hover:border-border hover:bg-surface hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Blog
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <span
            className={`mb-6 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getCategoryColor()}`}
          >
            {post.category}
          </span>
          <h1 className="mb-8 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.readingTime} read
            </span>
            <span className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">M</div>
              By {post.author}
            </span>
          </div>
        </motion.header>

        {/* Featured Image */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-16 aspect-[21/9] w-full overflow-hidden rounded-3xl border border-border/50 bg-surface shadow-2xl"
        >
          {post.image ? (
            <img 
              src={post.image} 
              alt={post.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-chart-2/20 to-chart-4/20" />
          )}
        </motion.div>

        {/* Article Content */}
        <motion.article
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="prose prose-lg md:prose-xl max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-2xl"
        >
          <div className="space-y-6 text-foreground/90 leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {post.content || ""}
            </ReactMarkdown>
          </div>
        </motion.article>

        {/* CTA Section */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-24 relative overflow-hidden rounded-3xl border border-border/50 bg-surface p-12 text-center shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h3 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground">
              Ready to Start Tracking?
            </h3>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted">
              Join thousands of users who are achieving their nutrition goals with MacroTrackr's premium tracking experience.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/register"
                search={{ returnTo: undefined }}
                className="rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
              >
                Start Free Trial
              </Link>
              <Link
                to="/"
                className="rounded-full border border-border px-8 py-4 font-semibold text-foreground transition-all hover:bg-muted hover:border-primary/50"
              >
                Learn More
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogArticlePage;
