import { Link } from "@tanstack/react-router";

import type { BlogPost } from "@/types/blog";
import { formatDate } from "@/utils/dateUtilities";

/**
 * The ruled index of articles: title and summary, with category, date and
 * reading time aligned in a column. The archive and an article's "Keep
 * reading" both draw it, so the two cannot drift apart again.
 */
export default function BlogPostList({
  posts,
}: {
  posts: Pick<BlogPost, "slug" | "title" | "excerpt" | "category" | "date" | "readingTime">[];
}) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="group flex flex-col gap-2 border-b border-border py-6 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:flex-row sm:items-baseline sm:gap-8"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold tracking-tight text-foreground">
                {post.title}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-muted">
                {post.excerpt}
              </span>
            </span>

            <span className="flex shrink-0 gap-4 text-xs whitespace-nowrap text-muted sm:w-64 sm:justify-end">
              <span>{post.category}</span>
              <span className="tabular-nums">{formatDate(post.date)}</span>
              <span className="tabular-nums">{post.readingTime} read</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
