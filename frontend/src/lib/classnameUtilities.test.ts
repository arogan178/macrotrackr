import { describe, expect, it } from "vitest";

import { cn } from "./classnameUtilities";

describe("classnameUtilities", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      const result = cn("foo", false && "bar", "baz");
      expect(result).toContain("foo");
      expect(result).toContain("baz");
    });

    it("handles arrays", () => {
      const result = cn(["foo", "bar"]);
      expect(result).toBe("foo bar");
    });

    it("handles empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });
  });
});
