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

const UNIT_CONVERSIONS: Record<UnitType, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,

  ml: 1,
  L: 1000,
  cup: 236.588,
  tbsp: 14.7868,
  tsp: 4.928_92,
  pt: 500,

  unit: 1,
};

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

const COUNT_BASED_QUANTITY_PATTERN =
  /^([\d,.]+)\s*(egg|eggs|piece|pieces|pc|pcs|serving|servings|item|items)\b/;
const COUNT_ONLY_WORD_PATTERN =
  /\b(egg|eggs|piece|pieces|pc|pcs|serving|servings|item|items)\b/;

const MEASUREMENT_PATTERN =
  /([\d,.]+)\s*(fl\s*oz|g|gram|grams|kg|kilogram|kilograms|oz|ounce|ounces|lb|lbs|pound|pounds|ml|milliliter|milliliters|l|liter|liters|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pt|pint|pints)\b/;
const CUP_WITH_INGREDIENT_PATTERN =
  /([\d,.]+)\s*(cup|cups)\s+([a-z]+)/;

export const UnitConverter = {
  parseQuantity(input: string): ParsedQuantity {
    if (!input || typeof input !== "string") {
      return { quantity: 100, unit: "g", original: input || "" };
    }

    const trimmed = input.toLowerCase().trim();
    if (!trimmed) {
      return { quantity: 100, unit: "g", original: input };
    }

    if (trimmed === "1" || trimmed === "one" || trimmed === "a" || trimmed === "an") {
      return { quantity: 1, unit: "unit", original: input };
    }

    const countBasedMatch = trimmed.match(COUNT_BASED_QUANTITY_PATTERN);
    if (countBasedMatch?.[1]) {
      const count = Number.parseFloat(countBasedMatch[1].replace(",", "."));
      if (!Number.isNaN(count) && count > 0) {
        return { quantity: count, unit: "unit", original: input };
      }
    }

    if (COUNT_ONLY_WORD_PATTERN.test(trimmed)) {
      return { quantity: 1, unit: "unit", original: input };
    }

    const cupIngredientMatch = trimmed.match(CUP_WITH_INGREDIENT_PATTERN);
    if (cupIngredientMatch?.[1] && cupIngredientMatch[3]) {
      const quantity = Number.parseFloat(cupIngredientMatch[1].replace(",", "."));
      const ingredient = cupIngredientMatch[3].toLowerCase().trim();

      if (!Number.isNaN(quantity) && quantity > 0 && US_CUP_WEIGHTS[ingredient]) {
        const weightInGrams = quantity * US_CUP_WEIGHTS[ingredient];

        return {
          quantity: Math.round(weightInGrams * 100) / 100,
          unit: "g",
          original: input,
        };
      }
    }

    const measurementMatch = trimmed.match(MEASUREMENT_PATTERN);
    if (measurementMatch?.[1] && measurementMatch[2]) {
      const quantity = Number.parseFloat(measurementMatch[1].replace(",", "."));
      if (!Number.isNaN(quantity) && quantity > 0) {
        const rawUnit = measurementMatch[2].replaceAll(/\s+/g, " ").trim();
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
          "fl oz": "ml",
        };

        if (rawUnit === "fl oz") {
          return {
            quantity: Math.round(quantity * 29.5735 * 100) / 100,
            unit: "ml",
            original: input,
          };
        }

        const unit = unitMap[rawUnit] ?? "g";

        return { quantity, unit, original: input };
      }
    }

    return { quantity: 100, unit: "g", original: input };
  },

  convert(quantity: number, from: UnitType, to: UnitType): number {
    if (from === to) {
      return quantity;
    }

    if (from === "unit" || to === "unit") {
      return quantity;
    }

    let baseQuantity: number;

    if (this.isWeightUnit(from)) {
      baseQuantity = quantity * UNIT_CONVERSIONS[from];
    } else if (this.isVolumeUnit(from)) {
      baseQuantity = quantity * UNIT_CONVERSIONS[from];
    } else {
      return quantity;
    }

    if (this.isWeightUnit(to)) {
      return baseQuantity / UNIT_CONVERSIONS[to];
    } else if (this.isVolumeUnit(to)) {
      return baseQuantity / UNIT_CONVERSIONS[to];
    }

    return quantity;
  },

  toMetric(quantity: number, unit: UnitType): { quantity: number; unit: UnitType } {
    if (this.isMetricUnit(unit)) {
      return { quantity, unit };
    }

    let metricQuantity: number;
    let metricUnit: UnitType;

    if (unit === "oz" || unit === "lb") {
      metricQuantity = unit === "oz" ? quantity * 28.3495 : quantity * 453.592;

      metricUnit = metricQuantity >= 1000 ? "kg" : "g";
      if (metricUnit === "kg") {
        metricQuantity /= 1000;
      }
    } else if (unit === "cup" || unit === "tbsp" || unit === "tsp") {
      metricQuantity = quantity * UNIT_CONVERSIONS[unit];
      metricUnit = metricQuantity >= 1000 ? "L" : "ml";
      if (metricUnit === "L") {
        metricQuantity /= 1000;
      }
    } else {
      return { quantity, unit };
    }

    return {
      quantity: Math.round(metricQuantity * 100) / 100,
      unit: metricUnit,
    };
  },

  isWeightUnit(unit: UnitType): boolean {
    return ["g", "kg", "oz", "lb"].includes(unit);
  },

  isVolumeUnit(unit: UnitType): boolean {
    return ["ml", "L", "cup", "tbsp", "tsp", "pt"].includes(unit);
  },

  isMetricUnit(unit: UnitType): boolean {
    return ["g", "kg", "ml", "L"].includes(unit);
  },

  formatQuantity(quantity: number, unit: UnitType): string {
    if (unit === "unit") {
      return quantity === 1 ? "1 piece" : `${quantity} pieces`;
    }

    const rounded = Math.round(quantity * 100) / 100;

    return `${rounded}${unit}`;
  },

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

export function getMetricServing(quantity: number, unit: string): { quantity: number; unit: string } {
  const parsed = UnitConverter.parseQuantity(`${quantity} ${unit}`);
  const metric = UnitConverter.toMetric(parsed.quantity, parsed.unit as UnitType);

  return { quantity: metric.quantity, unit: metric.unit };
}
