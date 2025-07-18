export const SCORE_COLORS = {
  excellent: "bg-green-400",
  good: "bg-yellow-400",
  poor: "bg-red-400",
} as const;

export const METRIC_CARD_CONFIGS = {
  consistency: {
    bgGradient: "bg-gradient-to-br from-indigo-900/60 to-indigo-800/30",
    borderColor: "border border-indigo-700/30",
    textColor: "text-indigo-300",
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
    bar: "bg-green-500",
    text: "text-green-300",
  },
  carbs: {
    bar: "bg-blue-500",
    text: "text-blue-300",
  },
  fats: {
    bar: "bg-red-500",
    text: "text-red-300",
  },
} as const;

export const SECTION_STYLES = {
  atAGlance: "p-4 rounded-lg border border-purple-500/20 bg-purple-900/10",
  trendAnalysis: "p-4 rounded-lg border border-blue-500/20 bg-blue-900/10",
  trackingAnalysis:
    "p-4 rounded-lg border border-indigo-500/20 bg-indigo-900/10",
  recommendations: "p-4 rounded-lg border border-green-500/20 bg-green-900/10",
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
    color: "text-white",
    key: "calories" as const,
  },
  {
    label: "Protein",
    unit: "g",
    color: "text-green-300",
    key: "protein" as const,
  },
  {
    label: "Carbs",
    unit: "g",
    color: "text-blue-300",
    key: "carbs" as const,
  },
  {
    label: "Fats",
    unit: "g",
    color: "text-red-300",
    key: "fats" as const,
  },
] as const;
