import { describe, expect, it } from "vitest";

import { DURATIONS, EASINGS } from "@/components/utils/UiConstants";

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
    // Assert the source, not the figure. This file held 0.3 and its own
    // cubic-bezier while its header claimed it used existing tokens only; a
    // test that copies the number cannot tell the two apart.
    it("reads the motion tokens rather than holding its own", () => {
      expect(TRANSITIONS.duration).toBe(DURATIONS.base);
      expect(TRANSITIONS.ease).toBe(EASINGS.out);
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
      expect(CARD_BASE_CLASSES).toContain("rounded-card");
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
