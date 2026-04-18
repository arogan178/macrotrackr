import type { BlogCategory, BlogPost } from "@/types/blog";

import blogPosts from "../data/blog-posts.json";

const contentModules = import.meta.glob("../data/blog-content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function slugify(value: string) {
  return value.toLowerCase().replaceAll(/[^\da-z]+/g, "-").replaceAll(/^-|-$/g, "");
}

const normalizedPosts: BlogPost[] = [...blogPosts]
  .map((post) => ({
    ...post,
    category: post.category as BlogPost["category"],
    tags: Array.isArray(post.tags) ? post.tags : [],
  }))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function getAllPosts(): BlogPost[] {
  return normalizedPosts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const post = normalizedPosts.find((candidate) => candidate.slug === slug);
  if (!post) return null;

  return {
    ...post,
    content:
      (contentModules[`../data/blog-content/${slug}.md`] as string) || "",
  };
}

export function getBlogCategories(): BlogCategory[] {
  const categories = new Map<string, BlogCategory>();

  for (const post of normalizedPosts) {
    const key = slugify(post.category);
    const existing = categories.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    categories.set(key, {
      name: post.category,
      slug: key,
      count: 1,
    });
  }

  return [{ name: "All", slug: "all", count: normalizedPosts.length }, ...categories.values()];
}

export function getAllTags(): string[] {
  return [...new Set(normalizedPosts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b));
}

export function normalizeBlogFilter(value?: string) {
  return value ? slugify(value) : undefined;
}

export function filterPosts({
  category,
  tag,
  query,
}: {
  category?: string;
  tag?: string;
  query?: string;
}) {
  const normalizedCategory = normalizeBlogFilter(category);
  const normalizedTag = normalizeBlogFilter(tag);
  const normalizedQuery = query?.trim().toLowerCase();

  return normalizedPosts.filter((post) => {
    const matchesCategory =
      !normalizedCategory ||
      normalizedCategory === "all" ||
      slugify(post.category) === normalizedCategory;

    const matchesTag =
      !normalizedTag ||
      post.tags.some((postTag) => slugify(postTag) === normalizedTag);

    const matchesQuery =
      !normalizedQuery ||
      [post.title, post.excerpt, post.category, ...post.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesTag && matchesQuery;
  });
}

export function getRelatedPosts(slug: string, limit = 3) {
  const currentPost = normalizedPosts.find((post) => post.slug === slug);
  if (!currentPost) return [];

  return normalizedPosts
    .filter((post) => post.slug !== slug)
    .map((post) => {
      const sharedTags = post.tags.filter((tag) =>
        currentPost.tags.some((currentTag) => slugify(currentTag) === slugify(tag)),
      ).length;

      const sharedCategory = post.category === currentPost.category ? 1 : 0;

      return {
        post,
        score: sharedTags * 2 + sharedCategory,
      };
    })
    .sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime())
    .slice(0, limit)
    .map((item) => item.post);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export { type BlogPost } from "@/types/blog";
