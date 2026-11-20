/**
 * Shared chart types local to the chart folder
 */
export interface ChartDataPoint {
  name: string; // x-axis label (e.g., date)
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  weight?: number | null;
  hasEntries?: boolean;
  fullDate?: string;
  id?: string;
  [key: string]: number | string | boolean | null | undefined;
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
  /** Recharts animates on mount. Off by default in the app, where a chart
   *  redrawing itself every time a filter changes is noise. */
  isAnimationActive?: boolean;
  animationDuration?: number;
}

export interface NutritionAverage {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}
