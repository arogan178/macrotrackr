import {
  CALORIE_ADJUSTMENT_FACTORS,
  CALORIE_RANGE_LABELS,
  CALORIES_PER_KG_FAT,
  CARBS_PERCENTAGE,
  CHART_COLORS,
  DAILY_PROTEIN_PER_KG,
  DEFAULT_TARGET_VALUES,
  DEFAULT_TARGET_WEEKS,
  ERROR_MESSAGES,
  FATS_PERCENTAGE,
  MAX_SAFE_DAILY_CHANGE,
  MAX_WEEKLY_WEIGHT_LOSS,
  MIN_SAFE_DAILY_CHANGE,
  MIN_WEEKLY_WEIGHT_LOSS,
  SUCCESS_MESSAGES,
  WEIGHT_GOAL_OPTIONS,
  WEIGHT_VALIDATION,
} from "./constants";

describe("goals constants", () => {
  describe("CALORIE_ADJUSTMENT_FACTORS", () => {
    it("should have lose factor of -500", () => {
      expect(CALORIE_ADJUSTMENT_FACTORS.lose).toBe(-500);
    });

    it("should have maintain factor of 0", () => {
      expect(CALORIE_ADJUSTMENT_FACTORS.maintain).toBe(0);
    });

    it("should have gain factor of 300", () => {
      expect(CALORIE_ADJUSTMENT_FACTORS.gain).toBe(300);
    });
  });

  describe("CALORIE_RANGE_LABELS", () => {
    it("should have lose labels", () => {
      expect(CALORIE_RANGE_LABELS.lose.min).toBe("Faster");
    });

    it("should have maintain labels", () => {
      expect(CALORIE_RANGE_LABELS.maintain.mid).toBe("TDEE");
    });

    it("should have gain labels", () => {
      expect(CALORIE_RANGE_LABELS.gain.max).toBe("Faster");
    });
  });

  describe("DEFAULT_TARGET_VALUES", () => {
    it("should have protein percentage 30", () => {
      expect(DEFAULT_TARGET_VALUES.proteinPercentage).toBe(30);
    });

    it("should have carbs percentage 40", () => {
      expect(DEFAULT_TARGET_VALUES.carbsPercentage).toBe(40);
    });

    it("should have fats percentage 30", () => {
      expect(DEFAULT_TARGET_VALUES.fatsPercentage).toBe((30));
    });
  });

  describe("calculation constants", () => {
    it("should have correct protein per kg", () => {
      expect(DAILY_PROTEIN_PER_KG).toBe(2.1);
    });

    it("should have correct carbs percentage", () => {
      expect(CARBS_PERCENTAGE).toBe(0.5);
    });

    it("should have correct fats percentage", () => {
      expect(FATS_PERCENTAGE).toBe(0.25);
    });

    it("should have correct calories per kg fat", () => {
      expect(CALORIES_PER_KG_FAT).toBe(7700);
    });
  });

  describe("WEIGHT_VALIDATION", () => {
    it("should have min weight of 1", () => {
      expect(WEIGHT_VALIDATION.min).toBe(1);
    });

    it("should have max weight of 1000", () => {
      expect(WEIGHT_VALIDATION.max).toBe(1000);
    });

    it("should have min calories of 1000", () => {
      expect(WEIGHT_VALIDATION.minCalories).toBe(1000);
    });
  });

  describe("WEIGHT_GOAL_OPTIONS", () => {
    it("should have 3 options", () => {
      expect(WEIGHT_GOAL_OPTIONS).toHaveLength(3);
    });

    it("should have lose option", () => {
      expect(WEIGHT_GOAL_OPTIONS[0].value).toBe("lose");
    });
  });

  describe("CHART_COLORS", () => {
    it("should have weight color", () => {
      expect(CHART_COLORS.weight).toBe("#3B82F6");
    });

    it("should have target color", () => {
      expect(CHART_COLORS.target).toBe("#EF4444");
    });
  });

  describe("SUCCESS_MESSAGES", () => {
    it("should have goal created message", () => {
      expect(SUCCESS_MESSAGES.goalCreated).toBe("Weight goal created successfully!");
    });
  });

  describe("ERROR_MESSAGES", () => {
    it("should have goal create error message", () => {
      expect(ERROR_MESSAGES.goalCreate).toBe("Failed to create weight goal");
    });

    it("should have network error message", () => {
      expect(ERROR_MESSAGES.network).toBe("Network error. Please try again.");
    });
  });
});
