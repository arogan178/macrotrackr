import { describe, expect, it } from "vitest";

const contentModules = import.meta.glob("../data/blog-content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

describe("blog content headings", () => {
  it("finds markdown files to check", () => {
    expect(Object.keys(contentModules).length).toBeGreaterThan(0);
  });

  // BlogArticlePage renders post.title as the page's h1, so a top-level
  // heading in the markdown would produce two h1 elements per article.
  it.each(Object.keys(contentModules))("%s has no top-level h1", (file) => {
    const h1Lines = contentModules[file]
      .split("\n")
      .filter((line) => /^# \S/.test(line));
    expect(h1Lines).toEqual([]);
  });
});
