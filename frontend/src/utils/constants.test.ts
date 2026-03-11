import { describe, expect, it } from "vitest";
import {
  USER_MINIMUM_AGE,
  USER_MAXIMUM_AGE,
  USER_MINIMUM_HEIGHT,
  USER_MAXIMUM_HEIGHT,
  USER_MINIMUM_WEIGHT,
  USER_MAXIMUM_WEIGHT,
  TEXT_FIELD_DEFAULT_MIN_LENGTH,
  TEXT_FIELD_DEFAULT_MAX_LENGTH,
  NUMBER_FIELD_ALLOWED_KEYS,
} from "./constants";

describe("constants", () => {
  describe("User validation constants", () => {
    it("has valid user age limits", () => {
      expect(USER_MINIMUM_AGE).toBe(18);
      expect(USER_MAXIMUM_AGE).toBe(80);
      expect(USER_MINIMUM_AGE).toBeLessThan(USER_MAXIMUM_AGE);
    });

    it("has valid user height limits", () => {
      expect(USER_MINIMUM_HEIGHT).toBe(120);
      expect(USER_MAXIMUM_HEIGHT).toBe(250);
      expect(USER_MINIMUM_HEIGHT).toBeLessThan(USER_MAXIMUM_HEIGHT);
    });

    it("has valid user weight limits", () => {
      expect(USER_MINIMUM_WEIGHT).toBe(50);
      expect(USER_MAXIMUM_WEIGHT).toBe(300);
      expect(USER_MINIMUM_WEIGHT).toBeLessThan(USER_MAXIMUM_WEIGHT);
    });
  });

  describe("Field validation constants", () => {
    it("has valid text field length limits", () => {
      expect(TEXT_FIELD_DEFAULT_MIN_LENGTH).toBe(2);
      expect(TEXT_FIELD_DEFAULT_MAX_LENGTH).toBe(16);
      expect(TEXT_FIELD_DEFAULT_MIN_LENGTH).toBeLessThan(TEXT_FIELD_DEFAULT_MAX_LENGTH);
    });

    it("has number field allowed keys", () => {
      expect(NUMBER_FIELD_ALLOWED_KEYS).toContain("Backspace");
      expect(NUMBER_FIELD_ALLOWED_KEYS).toContain("Delete");
      expect(NUMBER_FIELD_ALLOWED_KEYS).toContain("ArrowLeft");
      expect(NUMBER_FIELD_ALLOWED_KEYS).toContain("ArrowRight");
    });
  });
});
