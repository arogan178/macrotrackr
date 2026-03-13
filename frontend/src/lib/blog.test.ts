import { describe, expect, it } from "vitest";

import { getAllPosts, formatDate } from "./blog";

describe("blog", () => {
  describe("getAllPosts", () => {
    it("returns an array", () => {
      const posts = getAllPosts();
      expect(Array.isArray(posts)).toBe(true);
    });
  });

  describe("formatDate", () => {
    it("formats date string", () => {
      const result = formatDate("2024-01-15");
      expect(typeof result).toBe("string");
    });
  });
});
