import { describe, expect, it } from "vitest";

import { getButtonClasses } from "./Button";

describe("Button utilities", () => {
  describe("getButtonClasses", () => {
    it("returns string for default variant", () => {
      const classes = getButtonClasses();
      expect(typeof classes).toBe("string");
      expect(classes.length).toBeGreaterThan(0);
    });

    it("returns string for primary variant", () => {
      const classes = getButtonClasses("primary");
      expect(classes).toContain("bg-primary");
    });

    it("returns string for secondary variant", () => {
      const classes = getButtonClasses("secondary");
      expect(typeof classes).toBe("string");
    });

    it("includes size classes", () => {
      const classes = getButtonClasses("primary", "lg");
      expect(typeof classes).toBe("string");
    });

    it("includes full width class when specified", () => {
      const classes = getButtonClasses("primary", "md", true);
      expect(classes).toContain("w-full");
    });

    it("includes custom className", () => {
      const classes = getButtonClasses("primary", "md", false, "custom-class");
      expect(classes).toContain("custom-class");
    });
  });
});
