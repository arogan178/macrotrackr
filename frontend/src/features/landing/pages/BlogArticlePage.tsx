import React, { Suspense, useCallback, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, Link2 } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { ContentImage } from "@/components/ui";
import { MealGroupingFlow } from "@/features/landing/components/AnimatedUserFlow";
import { BlogNotFound } from "@/features/landing/components/BlogNotFound";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import Header from "@/features/landing/components/Header";
import usePageMetadata from "@/hooks/usePageMetadata";
import {
  formatDate,
  getPostBySlug,
  getRelatedPosts,
  normalizeBlogFilter,
} from "@/lib/blog";

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface LazyCodeHighlighterProps {
  code: string;
  language: string;
}

const interactiveChipClasses =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border/60 px-3 py-2 text-xs font-medium tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const codeBlockClassName =
  "overflow-x-auto p-5 font-mono text-sm leading-7 text-white";
const codeBlockStyle = {
  margin: 0,
  padding: "1.25rem",
  background: "transparent",
  fontSize: "0.875rem",
  lineHeight: "1.7",
};

const LazyCodeHighlighter = React.lazy(async () => {
  const [{ Prism }, { vscDarkPlus }] = await Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/prism"),
  ]);

  return {
    default: ({ code, language }: LazyCodeHighlighterProps) => (
      <Prism
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={codeBlockStyle}
      >
        {code}
      </Prism>
    ),
  };
});

const CodeBlock: React.FC<CodeBlockProps> = ({
  inline,
  className,
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  if (inline) {
    return (
      <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm text-primary">
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg bg-[#1e1e1e] shadow-xl ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-2">
        <span className="text-xs font-medium text-white/60 uppercase">
          {language || "text"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              <span className="text-success">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <Suspense
        fallback={
          <pre className={codeBlockClassName}>
            <code>{code}</code>
          </pre>
        }
      >
        <LazyCodeHighlighter code={code} language={language} />
      </Suspense>
    </div>
  );
};

const markdownComponents = {
  h1: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
    <h1
      id={id}
      className="mt-14 scroll-mt-32 text-3xl font-semibold tracking-tight text-foreground first:mt-0 sm:text-[2.25rem]"
    >
      {children}
    </h1>
  ),
  h2: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
    <h2
      id={id}
      className="mt-14 scroll-mt-32 text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
    <h3
      id={id}
      className="mt-10 scroll-mt-32 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
    >
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-7 text-[1.05rem] leading-8 text-foreground/88 sm:text-[1.1rem] sm:leading-9">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-8 list-outside list-disc space-y-3 pl-6 marker:text-primary">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-8 list-outside list-decimal space-y-3 pl-6 marker:text-primary">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="pl-1 text-[1.02rem] leading-8 text-foreground/88">
      {children}
    </li>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-10 rounded-3xl border border-primary/20 bg-primary/6 px-6 py-5 text-lg leading-8 text-foreground/82 italic shadow-sm">
      {children}
    </blockquote>
  ),
  code: ({
    inline,
    className,
    children,
  }: {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  }) => (
    <CodeBlock inline={inline} className={className}>
      {children}
    </CodeBlock>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <ContentImage
      src={src}
      alt={alt ?? ""}
      containerClassName="my-10 overflow-hidden rounded-3xl shadow-xl ring-1 ring-border/50"
      className="w-full rounded-lg"
      loading="lazy"
    />
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-surface-2">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-border px-4 py-3 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-border px-4 py-3 text-foreground/90 last:border-b-0">
      {children}
    </td>
  ),
};

const ReadingProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-60 h-1 origin-left bg-primary"
      style={{ scaleX }}
    />
  );
};

const BlogArticlePage: React.FC = () => {
  const { slug } = useParams({ from: "/blog/$slug" });
  const shouldReduceMotion = useReducedMotion();
  const post = getPostBySlug(slug);
  const [copiedLink, setCopiedLink] = useState(false);

  usePageMetadata({
    title: post ? `${post.title} — MacroTrackr Blog` : "Blog — MacroTrackr",
    description: post?.excerpt ?? "Read the latest from MacroTrackr.",
    canonical: `https://macrotrackr.com/blog/${slug}`,
  });

  const relatedPosts = useMemo(() => getRelatedPosts(slug), [slug]);

  const handleCopyLink = useCallback(async () => {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(globalThis.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, []);

  if (!post) {
    return <BlogNotFound />;
  }

  return (
    <div
      className={`relative min-h-screen bg-background text-foreground ${shouldReduceMotion ? "" : "scroll-smooth"}`}
    >
      <ReadingProgress />
      <Header />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 flex items-start justify-end">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link
                to="/blog"
                search={{ category: undefined, tag: undefined, q: undefined }}
                className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:border-primary/40 hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to the blog
              </Link>
            </motion.div>
          </div>

          <motion.header
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-center"
          >
            <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-2 text-xs font-medium tracking-[0.16em] uppercase">
              <span className="font-semibold text-primary">
                {post.category}
              </span>
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span>{post.readingTime}</span>
            </div>
            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              {post.title}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-muted">
              {post.excerpt}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
              <span>By {post.author}</span>
              <span>·</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border/60 px-3 py-2 transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                {copiedLink ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {copiedLink ? "Link copied" : "Copy article link"}
              </button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to="/blog"
                  search={{
                    category: undefined,
                    q: undefined,
                    tag: normalizeBlogFilter(tag),
                  }}
                  className={interactiveChipClasses}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </motion.header>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="relative mt-10 aspect-video overflow-hidden rounded-3xl border border-border bg-surface shadow-xl"
          >
            {post.image ? (
              <ContentImage
                src={post.image}
                alt={post.title}
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div className="h-full w-full bg-muted/20" />
            )}
          </motion.div>

          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-12"
          >
            <div className="mx-auto max-w-3xl rounded-4xl border border-border/60 bg-surface/70 px-6 py-8 shadow-sm backdrop-blur-sm sm:px-10 sm:py-10">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                  rehypeSlug,
                  [rehypeAutolinkHeadings, { behavior: "wrap" }],
                ]}
                components={markdownComponents}
              >
                {post.content ?? ""}
              </ReactMarkdown>
            </div>

            {post.slug === "v2-launch-complete-ui-overhaul" && (
              <div className="not-prose mt-12 rounded-3xl border border-border bg-surface p-6 shadow-sm">
                <h3 className="text-center text-2xl font-semibold tracking-tight text-foreground">
                  See grouped meals in action
                </h3>
                <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-muted">
                  The release focused on making grouped meals editable instead
                  of flattening them into dead totals. This flow shows the
                  interaction pattern behind that change.
                </p>
                <div className="mt-8">
                  <MealGroupingFlow />
                </div>
              </div>
            )}
          </motion.article>

          {relatedPosts.length > 0 && (
            <section className="mt-14">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Keep reading
                </h2>
                <Link
                  to="/blog"
                  search={{
                    category: undefined,
                    tag: undefined,
                    q: undefined,
                  }}
                  className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                >
                  View all posts
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    to="/blog/$slug"
                    params={{ slug: relatedPost.slug }}
                    className="group overflow-hidden rounded-lg border border-border bg-surface transition-[background-color,border-color] duration-200 hover:border-primary/40 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                  >
                    <div className="relative aspect-16/10 overflow-hidden">
                      {relatedPost.image ? (
                        <ContentImage
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          className="transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted/20" />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
                        <span>{relatedPost.category}</span>
                        <span>·</span>
                        <span>{relatedPost.readingTime}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {relatedPost.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
};

export default BlogArticlePage;
