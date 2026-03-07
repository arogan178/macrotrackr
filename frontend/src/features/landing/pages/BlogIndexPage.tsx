import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React, { useCallback, useMemo } from "react";

import { ContentImage, EmptyState } from "@/components/ui";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import Header from "@/features/landing/components/Header";
import usePageMetadata from "@/hooks/usePageMetadata";
import { filterPosts, getBlogCategories } from "@/lib/blog";

interface BlogIndexSearch {
  category?: string;
  tag?: string;
  q?: string;
}

const BlogIndexPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate({ from: "/blog" });
  const search = useSearch({ from: "/blog" }) as BlogIndexSearch;

  usePageMetadata({
    title: "Blog — MacroTrackr",
    description:
      "Clearer nutrition writing, product releases, and practical tracking advice from the MacroTrackr team.",
    canonical: "https://macrotrackr.com/blog",
  });

  const categories = useMemo(
    () => getBlogCategories().filter((c) => c.slug !== "all"),
    [],
  );
  const filteredPosts = useMemo(
    () =>
      filterPosts({
        category: search.category,
        tag: search.tag,
        query: search.q,
      }),
    [search.category, search.q, search.tag],
  );

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  const handleCategorySelection = useCallback(
    (category?: string) => {
      void navigate({
        to: "/blog",
        search: (previous) => ({
          ...previous,
          category,
          tag: undefined,
          q: undefined,
        }),
        resetScroll: false,
      });
    },
    [navigate],
  );

  const activeCategory = search.category || "all";

  return (
    <div
      className={`relative min-h-screen bg-background text-foreground ${shouldReduceMotion ? "" : "scroll-smooth"}`}
    >
      <Header />
      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-32 pb-24 sm:px-6 lg:px-8">
        <section className="mb-16">
          <div className="flex items-start justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Blog
              </h1>
              <p className="text-muted-foreground mt-4 text-xl">
                Nutrition writing, product updates, and advice for tracking
                macros.
              </p>
            </div>
            <Link
              to="/"
              className="hidden min-h-11 items-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:border-primary/40 hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none sm:inline-flex"
            >
              ← Back to Home
            </Link>
          </div>
        </section>

        <section className="mb-12 border-b border-border/40 pb-6">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleCategorySelection(undefined)}
              className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-[color,background-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
                activeCategory === "all"
                  ? "text-primary-foreground scale-105 bg-primary"
                  : "text-muted-foreground bg-surface hover:scale-105 hover:bg-surface-2 hover:text-foreground active:scale-95"
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;

              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() =>
                    handleCategorySelection(isActive ? undefined : cat.slug)
                  }
                  className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-[color,background-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
                    isActive
                      ? "text-primary-foreground scale-105 bg-primary"
                      : "text-muted-foreground bg-surface hover:scale-105 hover:bg-surface-2 hover:text-foreground active:scale-95"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </section>

        <section id="blog-posts" className="scroll-mt-32">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                {activeCategory === "all" ? "Recent" : "Showing"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {activeCategory === "all"
                  ? "All Articles"
                  : categories.find((c) => c.slug === activeCategory)?.name ||
                    activeCategory}
              </h2>
            </div>
            <p className="text-sm text-muted">
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "article" : "articles"}
            </p>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {featuredPost ? (
            <motion.div
              key={`articles-${activeCategory}-${search.tag || "all-tags"}-${search.q || "all-query"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Featured + Sidebar */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mt-8 grid h-full gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]"
              >
                <Link
                  to="/blog/$slug"
                  params={{ slug: featuredPost.slug }}
                  className="group block h-full overflow-hidden rounded-lg border border-border bg-surface transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/40 hover:bg-surface-2 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                >
                  <div className="grid h-full lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative min-h-70 overflow-hidden border-r border-border">
                      {featuredPost.image ? (
                        <ContentImage
                          src={featuredPost.image}
                          alt={featuredPost.title}
                          containerClassName="h-full"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted/20" />
                      )}
                    </div>
                    <div className="flex flex-col justify-between p-6">
                      <div>
                        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                          <span className="font-semibold text-primary">
                            {featuredPost.category}
                          </span>
                          <span>·</span>
                          <span>{featuredPost.readingTime}</span>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                          {featuredPost.title}
                        </h2>
                        <p className="text-muted-foreground mt-3 text-base">
                          {featuredPost.excerpt}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex h-full flex-col gap-5">
                  {remainingPosts.slice(0, 2).map((post) => (
                    <Link
                      key={post.slug}
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="group flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface p-5 transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/40 hover:bg-surface-2 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                    >
                      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                        <span className="text-primary">{post.category}</span>
                        <span>·</span>
                        <span>{post.readingTime}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground mt-2 line-clamp-2 flex-1 text-sm">
                        {post.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Grid Articles */}
              {remainingPosts.length > 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {remainingPosts.slice(2).map((post) => (
                    <Link
                      key={post.slug}
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/40 hover:bg-surface-2 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                    >
                      <div className="relative aspect-16/10 overflow-hidden border-b border-border">
                        {post.image ? (
                          <ContentImage
                            src={post.image}
                            alt={post.title}
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted/20" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                          <span className="text-primary">{post.category}</span>
                          <span>·</span>
                          <span>{post.readingTime}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground mt-2 flex-1 text-sm">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mt-10 rounded-lg border border-border bg-surface p-8">
                <EmptyState
                  title="No articles match this topic"
                  message="Pick another topic or switch back to all blog entries."
                  size="md"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
};

export default BlogIndexPage;
