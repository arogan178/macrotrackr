// Limits metadata for free tier restrictions
export interface HistoryLimits {
  totalAvailable: number;
  visibleCount: number;
  isRestricted: boolean;
  upgradePrompt?: string;
}

// Paginated macro history response for API pagination
export interface PaginatedMacroHistory {
  entries: MacroEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  limits?: HistoryLimits;
}
// Utility type for macro percentage keys
export type MacroType = "protein" | "carbs" | "fats";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MacroTargetGrams = {
  protein: number;
  carbs: number;
  fats: number;
};

export interface MacroTargetSettings {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  lockedMacros?: MacroType[];
}

export interface MacroPercentages {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

export type MacroKey = keyof MacroPercentages;

export interface MacroTargetState extends MacroPercentages {
  lockedMacros: MacroType[];
}

// MacroTarget interface for use in goals and other features
export interface MacroTarget {
  macroTarget?: MacroTargetSettings;
}
export interface Ingredient {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  quantity?: number;
  unit?: string;
  sourceEntryName?: string;
  sourceEntryId?: number;
  // Base macros per 100g/ml for scaling calculations
  baseProtein?: number;
  baseCarbs?: number;
  baseFats?: number;
  baseQuantity?: number;
  baseUnit?: string;
}

export interface MacroEntry {
  id: number;
  createdAt: string;
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string;
  entryDate: string;
  entryTime: string;
  foodName?: string;
  ingredients?: Ingredient[];
}

export interface MacroDailyTotals {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

/* UI component prop interfaces have been moved next to their owning components.
   Keep this file for domain and API-level types only. */
