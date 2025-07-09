// Re-export all types from the organized types folder
export * from "./types/insights-types";

// Additional reporting types
import type { MacroDailyTotals } from "@/types/macro";

export interface DateRangeData {
  startDate: string;
  endDate: string;
  days: number;
}

export interface ReportingPeriod {
  label: string;
  value: string;
  days: number;
}

export type { MacroDailyTotals };
