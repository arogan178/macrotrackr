/**
 * Shared chart types local to the chart folder
 */
export interface ChartDataPoint {
  name: string; // x-axis label (e.g., date)
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  weight?: number;
  fullDate?: string;
  id?: string;
  [key: string]: number | string | undefined;
}

export interface LineConfig {
  dataKey: string;
  name?: string;
  color?: string;
  strokeWidth?: number;
  dot?: React.ReactElement | object | boolean;
  activeDot?: React.ReactElement | object | boolean;
  type?: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter";
  connectNulls?: boolean;
  isArea?: boolean;
}

export interface NutritionAverage {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}
