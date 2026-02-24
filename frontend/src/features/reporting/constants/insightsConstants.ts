export const SCORE_COLORS = {
  excellent: "bg-success",
  good: "bg-warning",
  poor: "bg-error",
} as const;

export const METRIC_CARD_CONFIGS = {
  consistency: {
    bgGradient: "bg-gradient-to-br from-primary/60 to-primary/30",
    borderColor: "border border-primary/30",
    textColor: "text-primary",
  },
  macroBalance: {
    bgGradient: "bg-gradient-to-br from-purple-900/60 to-purple-800/30",
    borderColor: "border border-purple-700/30",
    textColor: "text-purple-300",
  },
  macroDensity: {
    bgGradient: "bg-gradient-to-br from-emerald-900/60 to-emerald-800/30",
    borderColor: "border border-emerald-700/30",
    textColor: "text-emerald-300",
  },
} as const;

export const MACRO_COLORS = {
  protein: {
    bar: "bg-protein",
    text: "text-protein",
  },
  carbs: {
    bar: "bg-carbs",
    text: "text-carbs",
  },
  fats: {
    bar: "bg-fats",
    text: "text-fats",
  },
} as const;

export const SECTION_STYLES = {
  atAGlance: "p-4 rounded-lg border border-purple-500/20 bg-purple-900/10",
  trendAnalysis: "p-4 rounded-lg border border-primary/20 bg-primary/10",
  trackingAnalysis: "p-4 rounded-lg border border-primary/20 bg-primary/10",
  recommendations: "p-4 rounded-lg border border-green-500/20 bg-success/10",
} as const;

export const DEFAULT_MACRO_TARGET = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
} as const;

export const TREND_THRESHOLD = {
  up: 3,
  down: -3,
} as const;

export const DAILY_AVERAGES_CONFIG = [
  {
    label: "Calories",
    unit: "cal",
    color: "text-error",
    key: "calories" as const,
  },
  {
    label: "Protein",
    unit: "g",
    color: "text-protein",
    key: "protein" as const,
  },
  {
    label: "Carbs",
    unit: "g",
    color: "text-carbs",
    key: "carbs" as const,
  },
  {
    label: "Fats",
    unit: "g",
    color: "text-fats",
    key: "fats" as const,
  },
] as const;
