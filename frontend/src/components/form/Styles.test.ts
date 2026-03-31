import { describe, expect, it } from "vitest";

import { formStyles } from "./FormStyles";

describe("formStyles", () => {
  describe("labels", () => {
    it("has label styles", () => {
      expect(formStyles.label).toBeDefined();
      expect(typeof formStyles.label).toBe("string");
    });

    it("has labelBase styles", () => {
      expect(formStyles.labelBase).toBeDefined();
    });

    it("has labelLg styles", () => {
      expect(formStyles.labelLg).toBeDefined();
    });
  });

  describe("input", () => {
    it("has base input styles", () => {
      expect(formStyles.input.base).toBeDefined();
      expect(formStyles.input.base).toContain("w-full");
    });

    it("has error input styles", () => {
      expect(formStyles.input.error).toBe("border-error");
    });

    it("has normal input styles", () => {
      expect(formStyles.input.normal).toBeDefined();
    });
  });

  describe("containers", () => {
    it("has container spacing", () => {
      expect(formStyles.container).toBe("space-y-2");
    });

    it("has icon container styles", () => {
      expect(formStyles.iconContainer).toBeDefined();
      expect(formStyles.iconContainer).toContain("absolute");
    });
  });

  describe("card", () => {
    it("has card container styles", () => {
      expect(formStyles.card.container).toBeDefined();
    });
  });
});
