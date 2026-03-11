import { describe, expect, it } from "vitest";

import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  COLOR_MAP,
  DEFAULT_LOADING_TEXT,
  ICON_BUTTON_SIZES,
  ICON_POSITIONS,
  ICON_SIZES,
  MACRO_COLORS,
} from "./designTokens";

describe("designTokens", () => {
  describe("COLOR_MAP", () => {
    it("has green color defined", () => {
      expect(COLOR_MAP.green).toBeDefined();
      expect(COLOR_MAP.green.text).toBe("text-success");
    });

    it("has blue color defined", () => {
      expect(COLOR_MAP.blue).toBeDefined();
      expect(COLOR_MAP.blue.text).toBe("text-blue");
    });

    it("has red color defined", () => {
      expect(COLOR_MAP.red).toBeDefined();
      expect(COLOR_MAP.red.text).toBe("text-error");
    });

    it("has accent color defined", () => {
      expect(COLOR_MAP.accent).toBeDefined();
    });
  });

  describe("MACRO_COLORS", () => {
    it("has protein color defined", () => {
      expect(MACRO_COLORS.protein).toBeDefined();
      expect(MACRO_COLORS.protein.color).toBe("bg-protein");
    });

    it("has carbs color defined", () => {
      expect(MACRO_COLORS.carbs).toBeDefined();
      expect(MACRO_COLORS.carbs.color).toBe("bg-carbs");
    });

    it("has fats color defined", () => {
      expect(MACRO_COLORS.fats).toBeDefined();
      expect(MACRO_COLORS.fats.color).toBe("bg-fats");
    });
  });

  describe("ICON_SIZES", () => {
    it("has small icon size defined", () => {
      expect(ICON_SIZES.sm).toBe("w-4 h-4");
    });

    it("has large icon size defined", () => {
      expect(ICON_SIZES.lg).toBe("w-6 h-6");
    });
  });

  describe("BUTTON_VARIANTS", () => {
    it("has primary variant", () => {
      expect(BUTTON_VARIANTS.PRIMARY).toBe("primary");
    });

    it("has danger variant", () => {
      expect(BUTTON_VARIANTS.DANGER).toBe("danger");
    });
  });

  describe("ICON_POSITIONS", () => {
    it("has left position", () => {
      expect(ICON_POSITIONS.LEFT).toBe("left");
    });

    it("has right position", () => {
      expect(ICON_POSITIONS.RIGHT).toBe("right");
    });
  });

  describe("ICON_BUTTON_SIZES", () => {
    it("has small size", () => {
      expect(ICON_BUTTON_SIZES.sm).toBe("p-1.5 w-8 h-8 aspect-square");
    });
  });

  describe("BUTTON_SIZES", () => {
    it("has small size", () => {
      expect(BUTTON_SIZES.sm).toBe("px-2 py-1 text-xs");
    });

    it("has medium size", () => {
      expect(BUTTON_SIZES.md).toBe("px-3.5 py-2 text-md");
    });
  });

  describe("DEFAULT_LOADING_TEXT", () => {
    it("has default loading text", () => {
      expect(DEFAULT_LOADING_TEXT).toBe("Processing...");
    });
  });
});
