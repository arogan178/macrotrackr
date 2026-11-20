import React, { Suspense, useCallback, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "@tanstack/react-router";
import { m, useReducedMotion, useScroll, useSpring } from "motion/react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import AppHeader from "@/components/layout/AppHeader";
import {
  CheckIcon,
  ChevronDownIcon,
  ContentImage,
  CopyIcon,
  Link2Icon,
} from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import author from "@/data/author.json";
import { MealGroupingFlow } from "@/features/landing/components/AnimatedUserFlow";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import { BlogNotFound } from "@/features/landing/components/BlogNotFound";
import BlogPostList from "@/features/landing/components/BlogPostList";
import Footer from "@/features/landing/components/Footer";
import { TOOLS_HUB_PATH } from "@/features/landing/tools/toolsCatalog";
import { usePageMetadata } from "@/hooks";
import {
  formatDate,
  getPostBySlug,
  getRelatedPosts,
  normalizeBlogFilter,
  RELEASE_CATEGORY,
} from "@/lib/blog";
import { BLOG_TITLE_SUFFIX } from "@/lib/pageMetadata";
import {
  APP_ICON_URL,
  APP_NAME,
  APP_URL,
  buildCanonicalUrl,
  SCHEMA_ORG_CONTEXT,
} from "@/utils/appConstants";

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface LazyCodeHighlighterProps {
  code: string;
  language: string;
}

interface TocHeading {
  id: string;
  text: string;
}

/** Matches github-slugger (used by rehype-slug) for standard ASCII markdown h2s. */
function extractH2Headings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const counts = new Map<string, number>();
  let inFence = false;

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line.startsWith("## ")) continue;

    const text = line
      .slice(3)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .trim();
    if (!text) continue;

    const base = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-");
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    const id = seen === 0 ? base : `${base}-${seen}`;

    headings.push({ id, text });
  }

  return headings;
}

const interactiveChipClasses =
  "inline-flex min-h-11 items-center justify-center rounded-control border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const codeBlockClassName =
  "overflow-x-auto p-5 font-mono text-sm leading-7 text-foreground";
const codeBlockStyle = {
  margin: 0,
  padding: "1.25rem",
  background: "transparent",
  fontSize: "0.875rem",
  lineHeight: "1.65",
};

const LazyCodeHighlighter = React.lazy(async () => {
  const [
    { default: SyntaxHighlighter },
    { default: vscDarkPlus },
    { default: ts },
    { default: js },
    { default: json },
    { default: bash },
    { default: css },
    { default: markdown },
  ] = await Promise.all([
    import("react-syntax-highlighter/dist/esm/prism-light"),
    import("react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus"),
    import("react-syntax-highlighter/dist/esm/languages/prism/typescript"),
    import("react-syntax-highlighter/dist/esm/languages/prism/javascript"),
    import("react-syntax-highlighter/dist/esm/languages/prism/json"),
    import("react-syntax-highlighter/dist/esm/languages/prism/bash"),
    import("react-syntax-highlighter/dist/esm/languages/prism/css"),
    import("react-syntax-highlighter/dist/esm/languages/prism/markdown"),
  ]);

  SyntaxHighlighter.registerLanguage("typescript", ts);
  SyntaxHighlighter.registerLanguage("ts", ts);
  SyntaxHighlighter.registerLanguage("javascript", js);
  SyntaxHighlighter.registerLanguage("js", js);
  SyntaxHighlighter.registerLanguage("json", json);
  SyntaxHighlighter.registerLanguage("bash", bash);
  SyntaxHighlighter.registerLanguage("sh", bash);
  SyntaxHighlighter.registerLanguage("css", css);
  SyntaxHighlighter.registerLanguage("markdown", markdown);
  SyntaxHighlighter.registerLanguage("md", markdown);

  return {
    default: ({ code, language }: LazyCodeHighlighterProps) => (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={codeBlockStyle}
      >
        {code}
      </SyntaxHighlighter>
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
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  if (inline) {
    return (
      <code className="rounded-control bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-6 overflow-hidden rounded-control border border-border-2 bg-surface-2">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <span className="font-mono text-xs font-medium text-muted">
          {language || "text"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-control px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5 text-success" />
              <span className="text-success">Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5" />
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
      className="mt-10 mb-4 scroll-mt-28 text-2xl font-semibold tracking-tight text-foreground first:mt-0"
    >
      {children}
    </h1>
  ),
  h2: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
    <h2
      id={id}
      className="mt-12 mb-4 scroll-mt-28 border-t border-border pt-8 text-xl font-semibold tracking-tight text-foreground first:mt-0 first:border-t-0 first:pt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
    <h3
      id={id}
      className="mt-8 mb-3 scroll-mt-28 text-base font-semibold tracking-tight text-foreground"
    >
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-5 text-[15.5px] leading-7 text-foreground/88">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-6 list-outside list-disc space-y-2 pl-5 marker:text-primary">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-6 list-outside list-decimal space-y-2 pl-5 marker:font-medium marker:text-primary">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="pl-1 text-[15.5px] leading-7 text-foreground/88">
      {children}
    </li>
  ),
  a: ({
    href,
    children,
    className,
  }: {
    href?: string;
    children?: React.ReactNode;
    className?: string;
  }) => (
    <a
      href={href}
      // A heading wrapped in its own anchor keeps the heading's colour.
      className={
        className === "heading-anchor"
          ? "text-inherit no-underline"
          : "font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
      }
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
    <blockquote className="my-7 rounded-card border border-border border-l-2 border-l-primary bg-surface px-5 py-4 text-sm leading-relaxed text-foreground/90 [&>p]:mb-2 [&>p]:text-sm [&>p]:leading-relaxed [&>p:last-child]:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-border" />,
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
      containerClassName="my-8 overflow-hidden rounded-card border border-border"
      className="w-full rounded-control"
      loading="lazy"
    />
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-7 overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full border-collapse text-sm tabular-nums">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="border-b border-border bg-surface-2">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted uppercase">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-t border-border px-4 py-2.5 text-foreground/90">
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
    <m.div
      className="fixed inset-x-0 top-0 z-60 h-0.5 origin-left bg-primary"
      style={{ scaleX }}
    />
  );
};

const BlogArticlePage: React.FC = () => {
  const params = useParams({ strict: false }) as { slug?: string };
  const [lastSlug, setLastSlug] = useState(params.slug);
  if (params.slug && params.slug !== lastSlug) {
    setLastSlug(params.slug);
  }
  const slug = params.slug || lastSlug || "";
  const shouldReduceMotion = useReducedMotion();
  const post = getPostBySlug(slug);
  const [copiedLink, setCopiedLink] = useState(false);

  usePageMetadata({
    title: post ? `${post.title}${BLOG_TITLE_SUFFIX}` : "Blog | MacroTrackr",
    description: post?.excerpt ?? "Read the latest from MacroTrackr.",
    canonical: buildCanonicalUrl(`/blog/${slug}`),
    noindex: post?.category === RELEASE_CATEGORY,
  });

  const tocHeadings = post?.content ? extractH2Headings(post.content) : [];

  const schemaScript = post
    ? JSON.stringify({
        "@context": SCHEMA_ORG_CONTEXT,
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "image": post.image ? `${APP_URL}${post.image}` : undefined,
        "datePublished": post.date,
        "author":
          post.author === author.name
            ? {
                "@type": "Person",
                "name": author.name,
                "jobTitle": author.role,
                "url": `${APP_URL}/about`,
              }
            : {
                "@type": "Organization",
                "name": post.author || author.releaseAuthor,
                "url": APP_URL,
              },
        "publisher": {
          "@type": "Organization",
          "name": APP_NAME,
          "logo": {
            "@type": "ImageObject",
            "url": APP_ICON_URL,
          },
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": buildCanonicalUrl(`/blog/${slug}`),
        },
      })
    : "";

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

  const showToc = tocHeadings.length >= 2;

  return (
    <div
      className={`relative min-h-dvh bg-background text-foreground ${shouldReduceMotion ? "" : "scroll-smooth"}`}
    >
      {schemaScript && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaScript }}
        />
      )}
      <ReadingProgress />
      <AppHeader mode="public" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-[var(--header-offset)] pb-24 sm:px-6 lg:px-8">
        <div
          className={
            showToc
              ? "lg:grid lg:grid-cols-[minmax(0,65ch)_13rem] lg:justify-between lg:gap-12"
              : "mx-auto max-w-[65ch]"
          }
        >
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex items-center gap-1.5 text-xs text-muted">
                <li>
                  <Link
                    to="/blog"
                    search={{ category: undefined, tag: undefined, q: undefined }}
                    className="transition-colors hover:text-foreground"
                  >
                    Blog
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    to="/blog"
                    search={{
                      category: normalizeBlogFilter(post.category),
                      tag: undefined,
                      q: undefined,
                    }}
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {post.category}
                  </Link>
                </li>
              </ol>
            </nav>

            <header>
              <Heading level="display">{post.title}</Heading>
              <p className="mt-4 text-base leading-relaxed text-muted">
                {post.excerpt}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y border-border py-1.5 text-xs text-muted">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-medium text-foreground">
                    {post.author}
                  </span>
                  <span className="tabular-nums">{formatDate(post.date)}</span>
                  <span className="tabular-nums">{post.readingTime} read</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-control transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  {copiedLink ? (
                    <CheckIcon className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Link2Icon className="h-3.5 w-3.5" />
                  )}
                  {copiedLink ? "Link copied" : "Copy link"}
                </button>
              </div>
            </header>

            {showToc && (
              <details className="group mt-6 rounded-card border border-border bg-surface px-4 py-2 lg:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-medium text-muted transition-colors hover:text-foreground">
                  <span>In this article</span>
                  <ChevronDownIcon className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <ol className="space-y-1.5 border-t border-border pt-3 pb-2 text-sm">
                  {tocHeadings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="block py-0.5 text-muted transition-colors hover:text-foreground"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <article className="mt-9">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                  rehypeSlug,
                  [
                    rehypeAutolinkHeadings,
                    {
                      behavior: "wrap",
                      properties: { className: ["heading-anchor"] },
                    },
                  ],
                ]}
                components={markdownComponents}
              >
                {post.content ?? ""}
              </ReactMarkdown>

              {post.slug === "v2-launch-complete-ui-overhaul" && (
                <div className="mt-10 rounded-card border border-border bg-surface p-6">
                  <h3 className="text-center text-xl font-semibold tracking-tight text-foreground">
                    See grouped meals in action
                  </h3>
                  <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-6 text-muted">
                    The release made grouped meals editable instead of
                    flattening them into static totals.
                  </p>
                  <div className="mt-6">
                    <MealGroupingFlow />
                  </div>
                </div>
              )}

              {post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
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
              )}
            </article>

            {post.author === author.name && (
              <section className="mt-8 border-t border-border pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {author.name}
                    </span>
                    <span className="ml-2 text-xs text-muted">
                      {author.role}
                    </span>
                  </div>
                  <Link
                    to="/about"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    About the author
                  </Link>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {author.bio}
                </p>
              </section>
            )}

            <Panel
              className="mt-10"
              padding="regular"
              title="Put this into practice"
              description="Turn the targets in this guide into a daily log you can keep. Free, no card, and your data stays exportable."
            >
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  search={{ returnTo: undefined }}
                  className={getButtonClasses("primary", "lg", false, "px-6")}
                >
                  Start tracking free
                </Link>
                <Link
                  to={TOOLS_HUB_PATH}
                  className={getButtonClasses("secondary", "lg", false, "px-6")}
                >
                  Work out your numbers
                </Link>
              </div>
            </Panel>

            {relatedPosts.length > 0 && (
              <section className="mt-14">
                <div className="mb-4 flex items-center justify-between">
                  <Heading level="panel">Keep reading</Heading>
                  <Link
                    to="/blog"
                    search={{
                      category: undefined,
                      tag: undefined,
                      q: undefined,
                    }}
                    className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                  >
                    View all posts
                  </Link>
                </div>
                <BlogPostList posts={relatedPosts} />
              </section>
            )}
          </div>

          {showToc && (
            <aside
              aria-label="On this page"
              className="hidden lg:block"
            >
              <div className="sticky top-[var(--header-offset)] border-l border-border pl-4">
                <p className={`${TYPE_SCALE.micro} text-muted`}>On this page</p>
                <ol className="mt-3 space-y-2 text-xs leading-relaxed">
                  {tocHeadings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="block text-muted transition-colors hover:text-foreground"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          )}
        </div>
      </div>

      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
};

export default BlogArticlePage;
