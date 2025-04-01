// Shared nutrition-related types used across features

/**
 * Basic macronutrient structure containing protein, carbs, and fats
 */
export interface MacroNutrients {
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * Extended macronutrients with calories
 */
export interface MacroNutrientsWithCalories extends MacroNutrients {
  calories: number;
}

/**
 * Macro target settings with percentages
 */
export interface MacroTargetSettings {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  locked_macros?: string[];
}

/**
 * Macro target in grams
 */
export interface MacroTarget {
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
}

/**
 * Color configuration for macro visualization
 */
export interface MacroVisualizationConfig {
  protein: {
    color: string;
    bgColor: string;
    textColor: string;
  };
  carbs: {
    color: string;
    bgColor: string;
    textColor: string;
  };
  fats: {
    color: string;
    bgColor: string;
    textColor: string;
  };
}
