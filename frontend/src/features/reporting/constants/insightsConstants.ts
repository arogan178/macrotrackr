export const SCORE_COLORS = {
  excellent: "bg-success",
  good: "bg-warning",
  poor: "bg-error",
} as const;

export const METRIC_CARD_CONFIGS = {
  consistency: {
    bgGradient: "bg-surface-2",
    borderColor: "border border-border/40",
    textColor: "text-foreground/90",
  },
  macroBalance: {
    bgGradient: "bg-surface-2",
    borderColor: "border border-border/40",
    textColor: "text-foreground/90",
  },
  macroDensity: {
    bgGradient: "bg-surface-2",
    borderColor: "border border-border/40",
    textColor: "text-foreground/90",
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
  atAGlance: "p-6 rounded-2xl border border-border/40 bg-surface-2",
  trendAnalysis: "p-6 rounded-2xl border border-border/40 bg-surface-2",
  trackingAnalysis: "p-6 rounded-2xl border border-border/40 bg-surface-2",
  recommendations: "p-6 rounded-2xl border border-border/40 bg-surface-2",
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
