import { MacroEntry } from "@/types/macro";

// Define local types that we need for calculations
interface TrendDataPoint {
  date: string;
  value: number;
}

interface DailyEntry {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface MacroData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// Macro calculation constants
export const MACRO_CALORIES: Record<string, number> = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

// Macro calculation utilities
export const calculateMacroCalories = (entry: MacroEntry): number => {
  const proteinCals = (entry.protein || 0) * MACRO_CALORIES.protein;
  const carbsCals = (entry.carbs || 0) * MACRO_CALORIES.carbs;
  const fatCals = (entry.fats || 0) * MACRO_CALORIES.fat;

  return proteinCals + carbsCals + fatCals;
};

export const calculateDailyTotals = (entries: MacroEntry[]): MacroData => {
  const totals = entries.reduce(
    (acc, entry) => {
      const entryCalories = calculateMacroCalories(entry);
      return {
        calories: acc.calories + entryCalories,
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fats: acc.fats + (entry.fats || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return totals;
};

export const calculateMacroPercentages = (
  macros: MacroData
): Record<string, number> => {
  const { calories, protein, carbs, fats } = macros;

  if (calories === 0) {
    return { protein: 0, carbs: 0, fats: 0 };
  }

  const proteinCals = protein * MACRO_CALORIES.protein;
  const carbsCals = carbs * MACRO_CALORIES.carbs;
  const fatsCals = fats * MACRO_CALORIES.fat;

  return {
    protein: Math.round((proteinCals / calories) * 100),
    carbs: Math.round((carbsCals / calories) * 100),
    fats: Math.round((fatsCals / calories) * 100),
  };
};

export const calculateAverageMacros = (
  dailyEntries: DailyEntry[]
): MacroData => {
  if (dailyEntries.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }

  const totals = dailyEntries.reduce(
    (acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fats: acc.fats + day.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const days = dailyEntries.length;
  return {
    calories: Math.round(totals.calories / days),
    protein: Math.round(totals.protein / days),
    carbs: Math.round(totals.carbs / days),
    fats: Math.round(totals.fats / days),
  };
};

// Trend calculation utilities
export const calculateTrendData = (
  dailyEntries: DailyEntry[],
  metric: keyof MacroData
): TrendDataPoint[] => {
  return dailyEntries.map((entry) => ({
    date: entry.date,
    value: entry[metric],
  }));
};

export const calculateMovingAverage = (
  data: TrendDataPoint[],
  windowSize: number = 3
): TrendDataPoint[] => {
  if (data.length < windowSize) return data;

  return data.map((point, index) => {
    if (index < windowSize - 1) return point;

    const window = data.slice(index - windowSize + 1, index + 1);
    const average = window.reduce((sum, p) => sum + p.value, 0) / windowSize;

    return {
      ...point,
      value: Math.round(average * 100) / 100, // Round to 2 decimal places
    };
  });
};

// Variance and consistency calculations
export const calculateVariance = (values: number[]): number => {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;

  return Math.round(variance * 100) / 100;
};

export const calculateStandardDeviation = (values: number[]): number => {
  return Math.round(Math.sqrt(calculateVariance(values)) * 100) / 100;
};

export const calculateMacroConsistencyScore = (values: number[]): number => {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const standardDev = calculateStandardDeviation(values);

  if (mean === 0) return 0;

  // Coefficient of variation as a consistency metric (lower is more consistent)
  const coefficientOfVariation = (standardDev / mean) * 100;

  // Convert to consistency score (higher is more consistent)
  return Math.max(0, Math.round((100 - coefficientOfVariation) * 100) / 100);
};
