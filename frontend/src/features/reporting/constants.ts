// Re-export existing constants
export * from "./constants/insights-constants";

// Date range and period constants
export const REPORTING_PERIODS = [
  { label: "Last 7 days", value: "week", days: 7 },
  { label: "Last 30 days", value: "month", days: 30 },
  { label: "Last 3 months", value: "3months", days: 90 },
] as const;

export const DATE_RANGE_MAPPING = {
  week: 7,
  month: 30,
  "3months": 90,
} as const;

// Chart configuration constants
export const CHART_COLORS = {
  calories: "#f59e0b", // amber-500
  protein: "#10b981", // emerald-500
  carbs: "#3b82f6", // blue-500
  fats: "#ef4444", // red-500
} as const;

export const CHART_DEFAULTS = {
  height: 300,
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  strokeWidth: 2,
  activeDotRadius: 6,
} as const;

// Insights scoring thresholds
export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  poor: 0,
} as const;

// Data quality thresholds
export const DATA_QUALITY_THRESHOLDS = {
  excellent: 0.9, // 90%+ completion rate
  good: 0.7, // 70%+ completion rate
  poor: 0.5, // 50%+ completion rate
} as const;

// Consistency scoring weights
export const CONSISTENCY_WEIGHTS = {
  frequency: 40, // 40% of score based on logging frequency
  variance: 60, // 60% of score based on data consistency
} as const;

// Animation constants
export const ANIMATION_DELAYS = {
  card: 0.1,
  chart: 0.2,
  insight: 0.3,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  noData: "No data available for the selected period",
  invalidDate: "Invalid date range provided",
  calculationError: "Error calculating insights",
} as const;
