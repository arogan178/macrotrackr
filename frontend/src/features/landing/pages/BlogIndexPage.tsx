import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import React from "react";

import Footer from "@/features/landing/components/Footer";
import Header from "@/features/landing/components/Header";
import {
  formatDate,
  getAllPosts,
  type BlogPost,
} from "@/lib/blog";
import usePageMetadata from "@/hooks/usePageMetadata";

const BlogIndexPage: React.FC = () => {
  usePageMetadata({
    title: "Blog — MacroTrackr",
    description:
      "Tips, guides, and updates from MacroTrackr. Learn about macro tracking, nutrition, and app updates.",
    canonical: "https://macrotrackr.com/blog",
  });

  const posts = getAllPosts();
  const shouldReduceMotion = useReducedMotion();

  const getCategoryColor = (category: BlogPost["category"]) => {
    switch (category) {
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
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Latest <span className="text-primary">Insights</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Tips, guides, and major updates from the MacroTrackr team. Dive into nutrition science or see what's new.
          </p>
        </motion.div>

        {/* Featured Post */}
        {posts.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              to="/blog/$slug"
              params={{ slug: posts[0].slug }}
              className="group mb-16 block cursor-pointer overflow-hidden rounded-3xl border border-border/50 bg-surface/50 transition-all hover:border-primary/50 hover:bg-surface hover:shadow-2xl hover:shadow-primary/5"
            >
              <div className="grid md:grid-cols-2">
                <div className="relative aspect-video md:aspect-auto overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent z-10" />
                  {posts[0].image ? (
                    <img 
                      src={posts[0].image} 
                      alt={posts[0].title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-chart-2/20" />
                  )}
                </div>
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <span
                    className={`mb-4 w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getCategoryColor(posts[0].category)}`}
                  >
                    {posts[0].category}
                  </span>
                  <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary lg:text-4xl">
                    {posts[0].title}
                  </h2>
                  <p className="mb-6 text-lg text-muted line-clamp-3">{posts[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                    <span>{formatDate(posts[0].date)}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{posts[0].readingTime} read</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Post Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(1).map((post, index) => (
            <motion.div
              key={post.slug}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 2) }}
            >
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface/50 transition-all hover:border-primary/50 hover:bg-surface hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="relative aspect-video overflow-hidden">
                  {post.image ? (
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span
                    className={`mb-3 w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getCategoryColor(post.category)}`}
                  >
                    {post.category}
                  </span>
                  <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mb-6 flex-1 text-sm text-muted line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span>{formatDate(post.date)}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{post.readingTime} read</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogIndexPage;
