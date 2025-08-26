// Unit conversion utilities for macro tracking
// Provides comprehensive unit conversion with proper type safety

export type UnitType = "g" | "kg" | "oz" | "lb" | "ml" | "L" | "cup" | "tbsp" | "tsp" | "pt" | "unit";

export interface UnitConversion {
  from: UnitType;
  to: UnitType;
  factor: number;
  description?: string;
}

export interface ParsedQuantity {
  quantity: number;
  unit: UnitType;
  original: string;
}

// Common unit conversions to grams or milliliters (base units)
const UNIT_CONVERSIONS: Record<UnitType, number> = {
  // Weight conversions (to grams)
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,

  // Volume conversions (to milliliters)
  ml: 1,
  L: 1000,
  cup: 236.588, // US cup
  tbsp: 14.7868, // US tablespoon
  tsp: 4.928_92, // US teaspoon
  pt: 500, // EU pint (500ml)

  // Special case for items counted by unit (e.g., "1 apple")
  unit: 1, // Will be handled specially based on context
};

// Standard US cup measurements for common foods (in grams)
const US_CUP_WEIGHTS: Record<string, number> = {
  flour: 125,
  sugar: 200,
  rice: 185,
  oats: 90,
  milk: 240,
  water: 240,
  oil: 218,
  butter: 227,
  cheese: 100,
  nuts: 150,
  berries: 140,
  vegetables: 150,
  fruits: 160,
};

// Unit converter as object with methods (not class)
export const UnitConverter = {
  /**
   * Parse a quantity string like "100g", "1.5 kg", "2 cups flour", etc.
   */
  parseQuantity(input: string): ParsedQuantity {
    if (!input || typeof input !== "string") {
      return { quantity: 100, unit: "g", original: input || "" };
    }

    const trimmed = input.toLowerCase().trim();
    if (!trimmed) {
      return { quantity: 100, unit: "g", original: input };
    }

    // Handle special cases first
    if (trimmed === "1" || trimmed === "one" || trimmed === "a" || trimmed === "an") {
      return { quantity: 1, unit: "unit", original: input };
    }

    // Match patterns like "100g", "1.5 kg", "2 cups", etc.
    const patterns = [
      // "100 g", "100g", "100 grams"
      /^([\d,.]+)\s*(g|gram|grams|kg|kilogram|kilograms|oz|ounce|ounces|lb|lbs|pound|pounds|ml|milliliter|milliliters|l|liter|liters|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pt|pint|pints)?(?:\s+(.+))?$/,
      // Handle "1 cup flour", "2 tbsp sugar", etc.
      /^([\d,.]+)\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pt|pint|pints)(?:\s+(.+))?$/,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        const quantityString = match[1].replace(",", ".");
        const quantity = Number.parseFloat(quantityString);

        if (Number.isNaN(quantity) || quantity <= 0) {
          continue;
        }

        // Determine unit
        let unit: UnitType = "g";
        const unitMatch = match[2];

        if (unitMatch) {
          // Normalize unit names
          const unitMap: Record<string, UnitType> = {
            g: "g",
            gram: "g",
            grams: "g",
            kg: "kg",
            kilogram: "kg",
            kilograms: "kg",
            oz: "oz",
            ounce: "oz",
            ounces: "oz",
            lb: "lb",
            lbs: "lb",
            pound: "lb",
            pounds: "lb",
            ml: "ml",
            milliliter: "ml",
            milliliters: "ml",
            l: "L",
            liter: "L",
            liters: "L",
            cup: "cup",
            cups: "cup",
            tbsp: "tbsp",
            tablespoon: "tbsp",
            tablespoons: "tbsp",
            tsp: "tsp",
            teaspoon: "tsp",
            teaspoons: "tsp",
            pt: "pt",
            pint: "pt",
            pints: "pt",
          };

          unit = unitMap[unitMatch] || "g";
        }

        // Handle ingredient-specific conversions for cups
        const ingredient = match[3]?.toLowerCase();
        if (unit === "cup" && ingredient && US_CUP_WEIGHTS[ingredient]) {
          // Convert cup measurement to grams using specific weight
          const weightInGrams = quantity * US_CUP_WEIGHTS[ingredient];
          return {
            quantity: Math.round(weightInGrams * 100) / 100,
            unit: "g",
            original: input,
          };
        }

        return { quantity, unit, original: input };
      }
    }

    // Fallback for unrecognized formats
    return { quantity: 100, unit: "g", original: input };
  },

  /**
   * Convert a quantity from one unit to another
   */
  convert(quantity: number, from: UnitType, to: UnitType): number {
    if (from === to) {
      return quantity;
    }

    // Handle special unit conversions
    if (from === "unit" || to === "unit") {
      return quantity; // Units are handled specially based on context
    }

    // Convert to base unit first, then to target unit
    let baseQuantity: number;

    if (this.isWeightUnit(from)) {
      baseQuantity = quantity * UNIT_CONVERSIONS[from];
    } else if (this.isVolumeUnit(from)) {
      baseQuantity = quantity * UNIT_CONVERSIONS[from];
    } else {
      // Unknown unit type, return as-is
      return quantity;
    }

    // Convert from base unit to target unit
    if (this.isWeightUnit(to)) {
      return baseQuantity / UNIT_CONVERSIONS[to];
    } else if (this.isVolumeUnit(to)) {
      return baseQuantity / UNIT_CONVERSIONS[to];
    }

    return quantity;
  },

  /**
   * Convert quantity to metric units for consistency
   */
  toMetric(quantity: number, unit: UnitType): { quantity: number; unit: UnitType } {
    if (this.isMetricUnit(unit)) {
      return { quantity, unit };
    }

    let metricQuantity: number;
    let metricUnit: UnitType;

    if (unit === "oz" || unit === "lb") {
      // Weight conversions
      metricQuantity = unit === "oz" ? quantity * 28.3495 : quantity * 453.592;

      metricUnit = metricQuantity >= 1000 ? "kg" : "g";
      if (metricUnit === "kg") {
        metricQuantity /= 1000;
      }
    } else if (unit === "cup" || unit === "tbsp" || unit === "tsp") {
      // Volume conversions
      metricQuantity = quantity * UNIT_CONVERSIONS[unit];
      metricUnit = metricQuantity >= 1000 ? "L" : "ml";
      if (metricUnit === "L") {
        metricQuantity /= 1000;
      }
    } else {
      // Unknown or already metric
      return { quantity, unit };
    }

    return {
      quantity: Math.round(metricQuantity * 100) / 100,
      unit: metricUnit,
    };
  },

  /**
   * Check if unit is a weight unit
   */
  isWeightUnit(unit: UnitType): boolean {
    return ["g", "kg", "oz", "lb"].includes(unit);
  },

  /**
   * Check if unit is a volume unit
   */
  isVolumeUnit(unit: UnitType): boolean {
    return ["ml", "L", "cup", "tbsp", "tsp", "pt"].includes(unit);
  },

  /**
   * Check if unit is already metric
   */
  isMetricUnit(unit: UnitType): boolean {
    return ["g", "kg", "ml", "L"].includes(unit);
  },

  /**
   * Format quantity for display
   */
  formatQuantity(quantity: number, unit: UnitType): string {
    if (unit === "unit") {
      return quantity === 1 ? "1 piece" : `${quantity} pieces`;
    }

    const rounded = Math.round(quantity * 100) / 100;
    return `${rounded}${unit}`;
  },

  /**
   * Get display name for unit
   */
  getUnitDisplayName(unit: UnitType): string {
    const displayNames: Record<UnitType, string> = {
      g: "grams",
      kg: "kilograms",
      oz: "ounces",
      lb: "pounds",
      ml: "milliliters",
      L: "liters",
      cup: "cups",
      tbsp: "tablespoons",
      tsp: "teaspoons",
      pt: "pints",
      unit: "pieces",
    };

    return displayNames[unit] || unit;
  },
};

// Backwards compatibility functions
export function getMetricServing(quantity: number, unit: string): { quantity: number; unit: string } {
  const parsed = UnitConverter.parseQuantity(`${quantity} ${unit}`);
  const metric = UnitConverter.toMetric(parsed.quantity, parsed.unit as UnitType);
  return { quantity: metric.quantity, unit: metric.unit };
}