import { describe, expect, it } from "vitest";

import {
  CARD_BASE_CLASSES,
  getColorByScore,
  getTextColorByScore,
  parseMacroRatio,
  STAGGER,
  TRANSITIONS,
} from "./unifiedInsightsUtilities";

describe("unifiedInsightsUtilities", () => {
  describe("TRANSITIONS", () => {
    it("has expected values", () => {
      expect(TRANSITIONS.duration).toBe(0.3);
      expect(TRANSITIONS.ease).toHaveLength(4);
    });
  });

  describe("STAGGER", () => {
    it("has expected values", () => {
      expect(STAGGER.topCard0).toBe(0);
      expect(STAGGER.topCard1).toBe(0.1);
    });
  });

  describe("CARD_BASE_CLASSES", () => {
    it("has base card classes", () => {
      expect(CARD_BASE_CLASSES).toContain("rounded-2xl");
      expect(CARD_BASE_CLASSES).toContain("bg-surface");
    });
  });

  describe("getColorByScore", () => {
    it("returns color based on score", () => {
      const highColor = getColorByScore(80);
      const lowColor = getColorByScore(20);
      expect(highColor).not.toBe(lowColor);
    });
  });

  describe("getTextColorByScore", () => {
    it("returns text color based on score", () => {
      const color = getTextColorByScore(50);
      expect(color).toBeDefined();
    });
  });

  describe("parseMacroRatio", () => {
    it("parses valid ratio", () => {
      expect(parseMacroRatio("40/30/30")).toEqual([40, 30, 30]);
    });

    it("handles undefined input", () => {
      expect(parseMacroRatio(undefined)).toEqual([0, 0, 0]);
    });

    it("handles null input", () => {
      expect(parseMacroRatio(null)).toEqual([0, 0, 0]);
    });
  });
});
