import React, { useCallback, useMemo } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";

import AppHeader from "@/components/layout/AppHeader";
import { StateCard, TabBar } from "@/components/ui";
import { getButtonClasses } from "@/components/ui/Button";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { TOOLS_HUB_PATH } from "@/features/landing/tools/toolsCatalog";
import { usePageMetadata } from "@/hooks";
import { filterPosts, getBlogCategories } from "@/lib/blog";
import { buildCanonicalUrl } from "@/utils/appConstants";

interface BlogIndexSearch {
  category?: string;
  tag?: string;
  q?: string;
}

const BlogIndexPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate({ from: "/blog/" });
  const search = useSearch({ from: "/blog/" }) as BlogIndexSearch;

  usePageMetadata({
    title: "Blog — MacroTrackr",
    description:
      "Clearer nutrition writing, product releases, and practical tracking advice from the MacroTrackr team.",
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
      className={`relative min-h-screen bg-background text-foreground ${shouldReduceMotion ? "" : "scroll-smooth"}`}
    >
      <AppHeader mode="public" />
      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-[var(--header-offset)] pb-24 sm:px-6 lg:px-8">
        {/* The header the calculators use, not a fourth page-title treatment.
            The "Back to Home" pill it replaced existed nowhere else in the app,
            and the header logo already goes home. */}
        <section className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Writing
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            How to set a target, how to hit it, and what the numbers actually
            mean. No product announcements.
          </p>
        </section>

        {/* The shared TabBar, not two hand-rolled chip styles. These were the
            last filter controls in the app drawing their own active state, and
            an active chip was solid brand green — the same green as the primary
            action, on a control that selects rather than commits. */}
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
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">
              {activeCategory === "all"
                ? "All writing"
                : (categories.find((c) => c.slug === activeCategory)?.name ??
                  activeCategory)}
            </h2>
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
            <ol>
              {filteredPosts.map((post, index) => (
                <li key={post.slug}>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="group flex flex-col gap-2 border-b border-border py-6 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:flex-row sm:items-baseline sm:gap-8"
                  >
                    <span
                      aria-hidden="true"
                      className="hidden w-8 shrink-0 text-sm text-muted tabular-nums sm:block"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {post.title}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">
                        {post.excerpt}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-baseline gap-4 text-xs text-muted sm:w-44 sm:justify-end">
                      <span>{post.category}</span>
                      <span className="tabular-nums">{post.readingTime}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
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
      </main>
      <Footer />
      <BackToTopButton label="Back to top" />
    </div>
  );
};

export default BlogIndexPage;
