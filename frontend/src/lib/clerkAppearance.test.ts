import { describe, expect, it } from "vitest";

import { clerkAppearance } from "./clerkAppearance";

describe("clerkAppearance", () => {
  describe("variables", () => {
    it("has color variables", () => {
      expect(clerkAppearance.variables.colorPrimary).toBe("#22c55e");
      expect(clerkAppearance.variables.colorBackground).toBe("#121218");
      expect(clerkAppearance.variables.colorForeground).toBe("#fafafa");
    });

    it("has border radius", () => {
      expect(clerkAppearance.variables.borderRadius).toBe("0.75rem");
    });

    it("has font family", () => {
      expect(clerkAppearance.variables.fontFamily).toContain("Inter");
    });
  });

  describe("elements", () => {
    it("has root box class", () => {
      expect(clerkAppearance.elements.rootBox).toBe("clerk-root-box");
    });

    it("has card styling", () => {
      expect(clerkAppearance.elements.card).toContain("bg-[#121218]");
    });
  });
});
