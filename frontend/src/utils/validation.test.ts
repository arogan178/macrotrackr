import { describe, expect, it } from "vitest";

import { isOldEnough } from "./validation";

describe("validation", () => {
  describe("isOldEnough", () => {
    it("returns true for user over 18", () => {
      // Someone born 20 years ago
      const date20YearsAgo = new Date();
      date20YearsAgo.setFullYear(date20YearsAgo.getFullYear() - 20);
      const dateString = date20YearsAgo.toISOString().split("T")[0];
      
      expect(isOldEnough(dateString)).toBe(true);
    });

    it("returns false for user under 18", () => {
      // Someone born 17 years ago
      const date17YearsAgo = new Date();
      date17YearsAgo.setFullYear(date17YearsAgo.getFullYear() - 17);
      const dateString = date17YearsAgo.toISOString().split("T")[0];
      
      expect(isOldEnough(dateString)).toBe(false);
    });

    it("returns true for exactly 18 year old", () => {
      // Someone born exactly 18 years ago
      const date18YearsAgo = new Date();
      date18YearsAgo.setFullYear(date18YearsAgo.getFullYear() - 18);
      const dateString = date18YearsAgo.toISOString().split("T")[0];
      
      expect(isOldEnough(dateString)).toBe(true);
    });
  });
});
