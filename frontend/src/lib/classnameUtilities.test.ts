import { describe, expect, it } from "vitest";
import { cn } from "./classnameUtilities";

describe("classnameUtilities", () => {
  describe("cn", () => {
    it("merges class names", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      const result = cn("foo", false && "bar", "baz");
      expect(result).toBe("foo baz");
    });

    it("handles arrays", () => {
      const result = cn(["foo", "bar"]);
      expect(result).toBe("foo bar");
    });

    it("handles empty inputs", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("handles undefined and null", () => {
      const result = cn("foo", undefined, null, "bar");
      expect(result).toBe("foo bar");
    });
  });
});
