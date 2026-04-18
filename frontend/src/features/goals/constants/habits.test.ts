import { describe, expect, it } from "vitest";

import {
  ANIMATION_DELAYS,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  ERROR_MESSAGES,
  HABIT_COLOR_OPTIONS,
  HABIT_COLORS,
  HABIT_ICON_OPTIONS,
  HABIT_ICONS,
  HABIT_VALIDATION,
  SUCCESS_MESSAGES,
} from "./habits";

describe("goals/constants/habits", () => {
  describe("HABIT_ICONS", () => {
    it("contains expected icon keys", () => {
      expect(HABIT_ICONS).toHaveProperty("calendar");
      expect(HABIT_ICONS).toHaveProperty("check-circle");
      expect(HABIT_ICONS).toHaveProperty("target");
      expect(HABIT_ICONS).toHaveProperty("award");
      expect(HABIT_ICONS).toHaveProperty("heart");
      expect(HABIT_ICONS).toHaveProperty("book");
      expect(HABIT_ICONS).toHaveProperty("coffee");
      expect(HABIT_ICONS).toHaveProperty("droplet");
      expect(HABIT_ICONS).toHaveProperty("dumbbell");
      expect(HABIT_ICONS).toHaveProperty("moon");
      expect(HABIT_ICONS).toHaveProperty("sun");
    });
  });

  describe("HABIT_COLORS", () => {
    it("contains expected color keys", () => {
      expect(HABIT_COLORS).toHaveProperty("indigo");
      expect(HABIT_COLORS).toHaveProperty("blue");
      expect(HABIT_COLORS).toHaveProperty("green");
      expect(HABIT_COLORS).toHaveProperty("purple");
    });

    it("has correct structure for each color", () => {
      const color = HABIT_COLORS.indigo;
      expect(color).toHaveProperty("bg");
      expect(color).toHaveProperty("border");
      expect(color).toHaveProperty("text");
      expect(color).toHaveProperty("button");
      expect(color).toHaveProperty("gradient");
    });
  });

  describe("DEFAULT_HABIT_COLOR", () => {
    it("has indigo as default", () => {
      expect(DEFAULT_HABIT_COLOR).toBe("indigo");
    });
  });

  describe("DEFAULT_HABIT_ICON", () => {
    it("has target as default icon", () => {
      expect(DEFAULT_HABIT_ICON).toBe("target");
    });
  });

  describe("HABIT_COLOR_OPTIONS", () => {
    it("has four color options", () => {
      expect(HABIT_COLOR_OPTIONS).toHaveLength(4);
    });

    it("has correct values", () => {
      expect(HABIT_COLOR_OPTIONS[0].value).toBe("indigo");
      expect(HABIT_COLOR_OPTIONS[1].value).toBe("blue");
      expect(HABIT_COLOR_OPTIONS[2].value).toBe("green");
      expect(HABIT_COLOR_OPTIONS[3].value).toBe("purple");
    });
  });

  describe("HABIT_ICON_OPTIONS", () => {
    it("has multiple icon options", () => {
      expect(HABIT_ICON_OPTIONS.length).toBeGreaterThan(0);
    });

    it("has correct structure for each option", () => {
      const option = HABIT_ICON_OPTIONS[0];
      expect(option).toHaveProperty("value");
      expect(option).toHaveProperty("label");
      expect(option).toHaveProperty("icon");
    });
  });

  describe("HABIT_VALIDATION", () => {
    it("has title validation", () => {
      expect(HABIT_VALIDATION.title).toHaveProperty("minLength");
      expect(HABIT_VALIDATION.title).toHaveProperty("maxLength");
      expect(HABIT_VALIDATION.title.minLength).toBe(1);
      expect(HABIT_VALIDATION.title.maxLength).toBe(100);
    });

    it("has target validation", () => {
      expect(HABIT_VALIDATION.target).toHaveProperty("min");
      expect(HABIT_VALIDATION.target).toHaveProperty("max");
      expect(HABIT_VALIDATION.target.min).toBe(1);
      expect(HABIT_VALIDATION.target.max).toBe(1000);
    });
  });

  describe("ANIMATION_DELAYS", () => {
    it("has card, action, and progress delays", () => {
      expect(ANIMATION_DELAYS).toHaveProperty("card");
      expect(ANIMATION_DELAYS).toHaveProperty("action");
      expect(ANIMATION_DELAYS).toHaveProperty("progress");
    });
  });

  describe("SUCCESS_MESSAGES", () => {
    it("has all success messages", () => {
      expect(SUCCESS_MESSAGES.created).toBeDefined();
      expect(SUCCESS_MESSAGES.updated).toBeDefined();
      expect(SUCCESS_MESSAGES.deleted).toBeDefined();
      expect(SUCCESS_MESSAGES.completed).toBeDefined();
      expect(SUCCESS_MESSAGES.progress).toBeDefined();
      expect(SUCCESS_MESSAGES.reset).toBeDefined();
    });
  });

  describe("ERROR_MESSAGES", () => {
    it("has all error messages", () => {
      expect(ERROR_MESSAGES.create).toBeDefined();
      expect(ERROR_MESSAGES.update).toBeDefined();
      expect(ERROR_MESSAGES.delete).toBeDefined();
      expect(ERROR_MESSAGES.complete).toBeDefined();
      expect(ERROR_MESSAGES.progress).toBeDefined();
      expect(ERROR_MESSAGES.fetch).toBeDefined();
      expect(ERROR_MESSAGES.reset).toBeDefined();
      expect(ERROR_MESSAGES.validation).toBeDefined();
    });
  });
});
