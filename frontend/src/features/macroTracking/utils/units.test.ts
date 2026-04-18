import { describe, expect, it } from "vitest";

import { getMetricServing, UnitConverter } from "./units";

describe("units", () => {
  describe("UnitConverter", () => {
    describe("isWeightUnit", () => {
      it("returns true for weight units", () => {
        expect(UnitConverter.isWeightUnit("g")).toBe(true);
        expect(UnitConverter.isWeightUnit("kg")).toBe(true);
        expect(UnitConverter.isWeightUnit("oz")).toBe(true);
        expect(UnitConverter.isWeightUnit("lb")).toBe(true);
      });

      it("returns false for non-weight units", () => {
        expect(UnitConverter.isWeightUnit("ml")).toBe(false);
        expect(UnitConverter.isWeightUnit("L")).toBe(false);
      });
    });

    describe("isVolumeUnit", () => {
      it("returns true for volume units", () => {
        expect(UnitConverter.isVolumeUnit("ml")).toBe(true);
        expect(UnitConverter.isVolumeUnit("L")).toBe(true);
        expect(UnitConverter.isVolumeUnit("cup")).toBe(true);
      });

      it("returns false for non-volume units", () => {
        expect(UnitConverter.isVolumeUnit("g")).toBe(false);
        expect(UnitConverter.isVolumeUnit("kg")).toBe(false);
      });
    });

    describe("isMetricUnit", () => {
      it("returns true for metric units", () => {
        expect(UnitConverter.isMetricUnit("g")).toBe(true);
        expect(UnitConverter.isMetricUnit("kg")).toBe(true);
        expect(UnitConverter.isMetricUnit("ml")).toBe(true);
        expect(UnitConverter.isMetricUnit("L")).toBe(true);
      });

      it("returns false for non-metric units", () => {
        expect(UnitConverter.isMetricUnit("oz")).toBe(false);
        expect(UnitConverter.isMetricUnit("lb")).toBe(false);
        expect(UnitConverter.isMetricUnit("cup")).toBe(false);
      });
    });

    describe("parseQuantity", () => {
      it("parses simple quantity", () => {
        const result = UnitConverter.parseQuantity("100g");
        expect(result.quantity).toBe(100);
        expect(result.unit).toBe("g");
        expect(result.original).toBe("100g");
      });

      it("parses quantity with space", () => {
        const result = UnitConverter.parseQuantity("200 g");
        expect(result.quantity).toBe(200);
        expect(result.unit).toBe("g");
      });

      it("handles decimal quantities", () => {
        const result = UnitConverter.parseQuantity("1.5kg");
        expect(result.quantity).toBe(1.5);
        expect(result.unit).toBe("kg");
      });

      it("handles comma decimal quantities", () => {
        const result = UnitConverter.parseQuantity("1,25 kg");
        expect(result.quantity).toBe(1.25);
        expect(result.unit).toBe("kg");
      });

      it("maps singular quantity words to unit", () => {
        expect(UnitConverter.parseQuantity("one")).toEqual({
          quantity: 1,
          unit: "unit",
          original: "one",
        });
        expect(UnitConverter.parseQuantity("an")).toEqual({
          quantity: 1,
          unit: "unit",
          original: "an",
        });
      });

      it("converts known cup ingredient weights to grams", () => {
        const flour = UnitConverter.parseQuantity("2 cups flour");
        expect(flour.unit).toBe("g");
        expect(flour.quantity).toBe(250);

        const berries = UnitConverter.parseQuantity("1 cup berries");
        expect(berries.unit).toBe("g");
        expect(berries.quantity).toBe(140);
      });

      it("falls back to defaults for invalid or empty inputs", () => {
        expect(UnitConverter.parseQuantity("")).toEqual({
          quantity: 100,
          unit: "g",
          original: "",
        });

        expect(UnitConverter.parseQuantity("0 g")).toEqual({
          quantity: 100,
          unit: "g",
          original: "0 g",
        });

        expect(UnitConverter.parseQuantity("totally unknown input")).toEqual({
          quantity: 100,
          unit: "g",
          original: "totally unknown input",
        });
      });

      it("parses food counts as unit servings", () => {
        expect(UnitConverter.parseQuantity("6 eggs")).toEqual({
          quantity: 6,
          unit: "unit",
          original: "6 eggs",
        });

        expect(UnitConverter.parseQuantity("Eggs")).toEqual({
          quantity: 1,
          unit: "unit",
          original: "Eggs",
        });

        expect(UnitConverter.parseQuantity("3 pieces")).toEqual({
          quantity: 3,
          unit: "unit",
          original: "3 pieces",
        });
      });

      it("parses fl oz volumes into metric milliliters", () => {
        expect(UnitConverter.parseQuantity("12 fl oz")).toEqual({
          quantity: 354.88,
          unit: "ml",
          original: "12 fl oz",
        });
      });
    });

    describe("convert", () => {
      it("returns original quantity when units match", () => {
        expect(UnitConverter.convert(42, "g", "g")).toBe(42);
      });

      it("converts between weight units", () => {
        expect(UnitConverter.convert(1, "kg", "g")).toBe(1000);
        expect(UnitConverter.convert(1000, "g", "kg")).toBe(1);
        expect(UnitConverter.convert(16, "oz", "lb")).toBeCloseTo(1, 2);
      });

      it("converts between volume units", () => {
        expect(UnitConverter.convert(1, "cup", "ml")).toBeCloseTo(236.588, 3);
        expect(UnitConverter.convert(3, "tsp", "tbsp")).toBeCloseTo(1, 2);
      });

      it("keeps quantity unchanged for unit-based pieces", () => {
        expect(UnitConverter.convert(3, "unit", "g")).toBe(3);
        expect(UnitConverter.convert(3, "g", "unit")).toBe(3);
      });
    });

    describe("toMetric", () => {
      it("normalizes imperial weights into grams or kilograms", () => {
        expect(UnitConverter.toMetric(1, "oz")).toEqual({
          quantity: 28.35,
          unit: "g",
        });
        expect(UnitConverter.toMetric(3, "lb")).toEqual({
          quantity: 1.36,
          unit: "kg",
        });
      });

      it("normalizes volume units into ml or liters", () => {
        expect(UnitConverter.toMetric(2, "cup")).toEqual({
          quantity: 473.18,
          unit: "ml",
        });
        expect(UnitConverter.toMetric(5, "cup")).toEqual({
          quantity: 1.18,
          unit: "L",
        });
      });

      it("returns metric units unchanged", () => {
        expect(UnitConverter.toMetric(250, "g")).toEqual({
          quantity: 250,
          unit: "g",
        });
        expect(UnitConverter.toMetric(1.5, "L")).toEqual({
          quantity: 1.5,
          unit: "L",
        });
      });
    });

    describe("formatQuantity", () => {
      it("formats weight quantity", () => {
        expect(UnitConverter.formatQuantity(100, "g")).toBe("100g");
      });

      it("formats unit quantity with plural", () => {
        expect(UnitConverter.formatQuantity(5, "unit")).toBe("5 pieces");
      });

      it("formats unit quantity with singular", () => {
        expect(UnitConverter.formatQuantity(1, "unit")).toBe("1 piece");
      });

      it("rounds quantities to two decimal places", () => {
        expect(UnitConverter.formatQuantity(1.236, "kg")).toBe("1.24kg");
        expect(UnitConverter.formatQuantity(1.234, "kg")).toBe("1.23kg");
      });
    });

    describe("getUnitDisplayName", () => {
      it("returns display names for units", () => {
        expect(UnitConverter.getUnitDisplayName("g")).toBe("grams");
        expect(UnitConverter.getUnitDisplayName("kg")).toBe("kilograms");
        expect(UnitConverter.getUnitDisplayName("ml")).toBe("milliliters");
        expect(UnitConverter.getUnitDisplayName("tbsp")).toBe("tablespoons");
        expect(UnitConverter.getUnitDisplayName("unit")).toBe("pieces");
      });
    });

    describe("getMetricServing", () => {
      it("parses and returns metric serving quantities", () => {
        expect(getMetricServing(2, "cup")).toEqual({
          quantity: 473.18,
          unit: "ml",
        });

        expect(getMetricServing(8, "oz")).toEqual({
          quantity: 226.8,
          unit: "g",
        });
      });
    });
  });
});
