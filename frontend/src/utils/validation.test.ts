import { describe, expect, it, vi } from "vitest";

import { isOldEnough } from "./validation";

describe("validation", () => {
  describe("isOldEnough", () => {
    it("returns true for users over minimum age", () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 20;
      const dateOfBirth = new Date(birthYear, 0, 1).toISOString().split("T")[0];
      expect(isOldEnough(dateOfBirth)).toBe(true);
    });

    it("returns false for users under minimum age", () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 10;
      const dateOfBirth = new Date(birthYear, 0, 1).toISOString().split("T")[0];
      expect(isOldEnough(dateOfBirth)).toBe(false);
    });

    it("returns true for exactly minimum age", () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 13;
      const birthMonth = today.getMonth();
      const birthDay = today.getDate() + 1;
      const dateOfBirth = new Date(birthYear, birthMonth, birthDay).toISOString().split("T")[0];
      expect(isOldEnough(dateOfBirth)).toBe(false);
    });
  });
});
