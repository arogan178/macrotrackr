import { describe, expect, it } from "vitest";

import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  COLOR_MAP,
  DATE_RANGE_OPTIONS,
  DEFAULT_LOADING_TEXT,
  ICON_BUTTON_SIZES,
  ICON_POSITIONS,
  ICON_SIZES,
  MACRO_COLORS,
  PROGRESS_BAR_COLORS,
  PROGRESS_BAR_HEIGHTS,
} from "./Constants";

describe("Constants", () => {
  describe("COLOR_MAP", () => {
    it("contains all expected color keys", () => {
      expect(COLOR_MAP).toHaveProperty("green");
      expect(COLOR_MAP).toHaveProperty("blue");
      expect(COLOR_MAP).toHaveProperty("red");
      expect(COLOR_MAP).toHaveProperty("accent");
      expect(COLOR_MAP).toHaveProperty("primary");
      expect(COLOR_MAP).toHaveProperty("indigo");
      expect(COLOR_MAP).toHaveProperty("purple");
      expect(COLOR_MAP).toHaveProperty("protein");
      expect(COLOR_MAP).toHaveProperty("carbs");
      expect(COLOR_MAP).toHaveProperty("fats");
    });

    it("has correct structure for each color", () => {
      const color = COLOR_MAP.green;
      expect(color).toHaveProperty("bg");
      expect(color).toHaveProperty("border");
      expect(color).toHaveProperty("text");
      expect(color).toHaveProperty("dot");
      expect(color).toHaveProperty("iconColor");
      expect(color).toHaveProperty("acronym");
      expect(color).toHaveProperty("gradient");
    });
  });

  describe("PROGRESS_BAR_COLORS", () => {
    it("contains all expected progress bar colors", () => {
      expect(PROGRESS_BAR_COLORS).toHaveProperty("blue");
      expect(PROGRESS_BAR_COLORS).toHaveProperty("green");
      expect(PROGRESS_BAR_COLORS).toHaveProperty("red");
      expect(PROGRESS_BAR_COLORS).toHaveProperty("accent");
      expect(PROGRESS_BAR_COLORS).toHaveProperty("purple");
      expect(PROGRESS_BAR_COLORS).toHaveProperty("protein");
      expect(PROGRESS_BAR_COLORS).toHaveProperty("carbs");
      expect(PROGRESS_BAR_COLORS).toHaveProperty("fats");
    });
  });

  describe("PROGRESS_BAR_HEIGHTS", () => {
    it("contains all expected height variants", () => {
      expect(PROGRESS_BAR_HEIGHTS).toHaveProperty("sm");
      expect(PROGRESS_BAR_HEIGHTS).toHaveProperty("md");
      expect(PROGRESS_BAR_HEIGHTS).toHaveProperty("lg");
    });
  });

  describe("MACRO_COLORS", () => {
    it("contains protein color configuration", () => {
      expect(MACRO_COLORS.protein).toHaveProperty("color");
      expect(MACRO_COLORS.protein).toHaveProperty("bgColor");
      expect(MACRO_COLORS.protein).toHaveProperty("textColor");
    });

    it("contains carbs color configuration", () => {
      expect(MACRO_COLORS.carbs).toHaveProperty("color");
      expect(MACRO_COLORS.carbs).toHaveProperty("bgColor");
      expect(MACRO_COLORS.carbs).toHaveProperty("textColor");
    });

    it("contains fats color configuration", () => {
      expect(MACRO_COLORS.fats).toHaveProperty("color");
      expect(MACRO_COLORS.fats).toHaveProperty("bgColor");
      expect(MACRO_COLORS.fats).toHaveProperty("textColor");
    });
  });

  describe("ICON_SIZES", () => {
    it("contains expected icon size keys", () => {
      expect(ICON_SIZES).toHaveProperty("sm");
      expect(ICON_SIZES).toHaveProperty("md");
      expect(ICON_SIZES).toHaveProperty("lg");
      expect(ICON_SIZES).toHaveProperty("xl");
      expect(ICON_SIZES).toHaveProperty("2xl");
    });
  });

  describe("BUTTON_VARIANTS", () => {
    it("contains all button variant values", () => {
      expect(BUTTON_VARIANTS.PRIMARY).toBe("primary");
      expect(BUTTON_VARIANTS.SECONDARY).toBe("secondary");
      expect(BUTTON_VARIANTS.DANGER).toBe("danger");
      expect(BUTTON_VARIANTS.SUCCESS).toBe("success");
      expect(BUTTON_VARIANTS.GHOST).toBe("ghost");
      expect(BUTTON_VARIANTS.OUTLINE).toBe("outline");
    });
  });

  describe("ICON_BUTTON_SIZES", () => {
    it("contains all icon button size variants", () => {
      expect(ICON_BUTTON_SIZES).toHaveProperty("sm");
      expect(ICON_BUTTON_SIZES).toHaveProperty("md");
      expect(ICON_BUTTON_SIZES).toHaveProperty("lg");
    });
  });

  describe("BUTTON_SIZES", () => {
    it("contains all button size variants", () => {
      expect(BUTTON_SIZES).toHaveProperty("xs");
      expect(BUTTON_SIZES).toHaveProperty("sm");
      expect(BUTTON_SIZES).toHaveProperty("md");
      expect(BUTTON_SIZES).toHaveProperty("lg");
    });
  });

  describe("ICON_POSITIONS", () => {
    it("contains left and right positions", () => {
      expect(ICON_POSITIONS.LEFT).toBe("left");
      expect(ICON_POSITIONS.RIGHT).toBe("right");
    });
  });

  describe("DEFAULT_LOADING_TEXT", () => {
    it("has a default loading text", () => {
      expect(DEFAULT_LOADING_TEXT).toBe("Processing...");
    });
  });

  describe("DATE_RANGE_OPTIONS", () => {
    it("contains expected date range options", () => {
      expect(DATE_RANGE_OPTIONS).toHaveLength(3);
      expect(DATE_RANGE_OPTIONS[0]).toHaveProperty("value");
      expect(DATE_RANGE_OPTIONS[0]).toHaveProperty("label");
    });
  });
});
