import React from "react";

// Type extracted from ReportingPage.tsx
export interface AggregatedDataPoint {
  name: string; // Recharts uses 'name' for the x-axis label
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// Types extracted from LineChartComponent.tsx
export interface ChartDataPoint {
  name: string; // x-axis label (e.g., date)
  [key: string]: number | string | undefined | null; // Allow multiple data keys (y-values)
}

export interface LineConfig {
  dataKey: string;
  name?: string; // Optional: Name for legend and tooltip
  color?: string; // Optional: HSL or RGB color string
  strokeWidth?: number;
  dot?: React.ReactElement | object | boolean;
  activeDot?: React.ReactElement | object | boolean;
  type?: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter";
  connectNulls?: boolean;
}
