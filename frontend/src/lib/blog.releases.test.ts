import { describe, expect, it } from "vitest";

import { filterPosts, getAllPosts, RELEASE_CATEGORY } from "./blog";

const isRelease = (post: { category: string }) =>
  post.category === RELEASE_CATEGORY;

describe("release notes in the blog", () => {
  it("stay out of the default feed", () => {
    // Two build announcements used to sit between articles on protein and
    // meal prep. Automating the changelog would only have added more.
    expect(filterPosts({}).some(isRelease)).toBe(false);
  });

  it("are still there when asked for by category", () => {
    const releases = filterPosts({ category: RELEASE_CATEGORY });

    expect(releases.length).toBeGreaterThan(0);
    expect(releases.every(isRelease)).toBe(true);
  });

  it("are still findable by search", () => {
    const hit = getAllPosts().find(isRelease);
    expect(hit).toBeDefined();

    const results = filterPosts({ query: hit!.title });
    expect(results.some((post) => post.slug === hit!.slug)).toBe(true);
  });

  it("still resolve as posts, so a direct link works", () => {
    expect(getAllPosts().some(isRelease)).toBe(true);
  });

  it("leaves the article feed otherwise intact", () => {
    const feed = filterPosts({});
    const articles = getAllPosts().filter((post) => !isRelease(post));

    expect(feed).toHaveLength(articles.length);
  });
});
