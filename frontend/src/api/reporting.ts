import { api, unwrap } from "@/api/core";

export interface MacroDensitySummaryParameters {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}

export interface MacroDensitySummaryItem {
  period: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  count: number;
}

export const reportingApi = {
  /**
   * @throws {ApiError}
   */
  getMacroDensitySummary: (
    parameters: MacroDensitySummaryParameters = {},
  ): Promise<MacroDensitySummaryItem[]> =>
    unwrap(api.api.reporting["nutrient-density-summary"].get({ query: parameters })),
};
