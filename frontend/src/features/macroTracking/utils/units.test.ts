import { describe, expect, it } from "vitest";

import { UnitConverter } from "./units";

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
    });

    describe("getUnitDisplayName", () => {
      it("returns display names for units", () => {
        expect(UnitConverter.getUnitDisplayName("g")).toBe("grams");
        expect(UnitConverter.getUnitDisplayName("kg")).toBe("kilograms");
        expect(UnitConverter.getUnitDisplayName("ml")).toBe("milliliters");
      });
    });
  });
});
