import React, { useCallback, useMemo } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";

import AppHeader from "@/components/layout/AppHeader";
import { Heading, StateCard, TabBar } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import BlogPostList from "@/features/landing/components/BlogPostList";
import Footer from "@/features/landing/components/Footer";
import { TOOLS_HUB_PATH } from "@/features/landing/tools/toolsCatalog";
import { usePageMetadata } from "@/hooks";
import { filterPosts, getBlogCategories } from "@/lib/blog";
import { getPageMetadata } from "@/lib/pageMetadata";
import { buildCanonicalUrl } from "@/utils/appConstants";

interface BlogIndexSearch {
  category?: string;
  tag?: string;
  q?: string;
}

const BlogIndexPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const search = (useSearch({ strict: false }) ?? {}) as BlogIndexSearch;

  usePageMetadata({
    ...getPageMetadata("/blog"),
    canonical: buildCanonicalUrl("/blog"),
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

  const activeCategory = search.category ?? "all";

  return (
    <div
      className={`relative min-h-dvh bg-background text-foreground ${shouldReduceMotion ? "" : "scroll-smooth"}`}
    >
      <AppHeader mode="public" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-[var(--header-offset)] pb-24 sm:px-6 lg:px-8">
        {/* The header the calculators use, not a fourth page-title treatment.
            The "Back to Home" pill it replaced existed nowhere else in the app,
            and the header logo already goes home. */}
        <section className="mb-12 text-center">
          <Heading level="display">Writing</Heading>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Practical guides on macro tracking, protein, meal prep, and
            MacroTrackr release notes.
          </p>
        </section>

        {/* The shared TabBar, not two hand-rolled chip styles. */}
        <section className="mb-12 border-b border-border pb-6">
          <TabBar
            items={[
              { key: "all", label: "All" },
              ...categories.map((cat) => ({ key: cat.slug, label: cat.name })),
            ]}
            activeKey={activeCategory}
            onChange={(key) =>
              handleCategorySelection(key === "all" ? undefined : key)
            }
            ariaLabel="Article categories"
            isMotion={false}
            size="sm"
            className="mx-auto flex-wrap justify-center"
          />
        </section>

        {/* A ruled index rather than a card grid.
            The rest of this site takes its identity from a nutrition panel:
            dense, ruled, figures aligned in a column. The blog was image-led
            cards with 280px photos, which read as a different product and put
            one article on the first screen. This puts the writing first and
            aligns the metadata the way every other number in the app is
            aligned. */}
        <section id="blog-posts" className="scroll-mt-32">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-muted">
                {search.tag
                  ? `Tagged "${search.tag}"`
                  : activeCategory === "all"
                    ? "All writing"
                    : (categories.find((c) => c.slug === activeCategory)?.name ??
                      activeCategory)}
              </h2>
              {search.tag && (
                <button
                  type="button"
                  onClick={() => handleCategorySelection(undefined)}
                  className="inline-flex items-center rounded-control border border-border px-2 py-0.5 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  Clear tag
                </button>
              )}
            </div>
            <p className="text-sm text-muted tabular-nums">
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "article" : "articles"}
            </p>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="py-16">
              <StateCard
                tone="empty"
                title="No articles match this topic"
                message="Pick another topic or switch back to all writing."
              />
            </div>
          ) : (
            <BlogPostList posts={filteredPosts} />
          )}
        </section>

        {/* Someone browsing the archive is reading about targets. The
            calculators answer that in one screen and need no account, so they
            are the honest next step here rather than a sign-up wall. */}
        <section className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Work out your own numbers
            </h2>
            <p className="mt-1 text-sm text-muted">
              Five free calculators for calories, macros and protein. No account
              needed.
            </p>
          </div>
          <Link
            to={TOOLS_HUB_PATH}
            className={getButtonClasses("primary", "lg", false, "px-6")}
          >
            Open the calculators
          </Link>
        </section>
      </div>
      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
};

export default BlogIndexPage;
