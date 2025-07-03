export interface AggregatedDataPoint {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface NutritionAverage {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MacroTargetSettings {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

export interface UnifiedInsightsProps {
  aggregatedData: AggregatedDataPoint[];
  averages: NutritionAverage;
  isLoading: boolean;
  showNoDataMessage?: boolean;
  macroTarget?: MacroTargetSettings | null;
}

export interface MacroBalanceResult {
  score: number;
  idealRatio: string;
  currentRatio: string;
  recommendations: string;
}

export interface TrendResult {
  direction: "up" | "down" | "stable" | "insufficient";
  percentage: number;
  message: string;
}

export interface DataQualityResult {
  daysLogged: number;
  totalDaysInPeriod: number;
  completionRate: number;
  message: string;
}

export interface NutrientDensityResult {
  score: number;
  message: string;
}

export interface InsightsData {
  consistencyScore: number;
  macroBalance: MacroBalanceResult;
  caloriesTrend: TrendResult;
  proteinTrend: TrendResult;
  dataQuality: DataQualityResult;
  nutrientDensity: NutrientDensityResult;
}

export interface DailyAverageItem {
  label: string;
  value: number;
  unit: string;
  color: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  score: number;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  delay?: number;
  children?: React.ReactNode;
}

export interface ActionCardProps {
  title: string;
  icon: React.ReactNode;
  message: string;
  bgColor: string;
}

export interface TrendDisplayProps {
  label: string;
  trend: TrendResult;
}
