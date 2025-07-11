// Re-export all types from the organized types folder
export * from "./types/insightsTypes";

// Additional reporting types

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

export { type MacroDailyTotals } from "@/types/macro";
