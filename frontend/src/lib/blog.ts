import type { BlogPost } from "@/types/blog";

export type { BlogPost };

import blogPosts from "../data/blog-posts.json";

const contentModules = import.meta.glob("../data/blog-content/*.md", {
  as: "raw",
  eager: true,
});

export function getAllPosts(): BlogPost[] {
  return blogPosts.map((post) => ({
    ...post,
    category: post.category as BlogPost["category"],
  }));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return null;

  const contentKey = `../data/blog-content/${slug}.md`;
  const content = (contentModules[contentKey] as string) || "";

  return {
    ...post,
    category: post.category as BlogPost["category"],
    content,
  };
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(
    (post) => post.category.toLowerCase().replace(/\s+/g, "-") === category,
  );
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
