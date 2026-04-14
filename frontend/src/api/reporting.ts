import { apiClient, type ApiError } from "@/api/core";

export interface MacroDensitySummaryParameters {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
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
  getMacroDensitySummary: async (
    parameters: MacroDensitySummaryParameters = {},
  ): Promise<MacroDensitySummaryItem[]> => {
    const searchParams = new URLSearchParams();
    if (parameters.startDate) searchParams.append("startDate", parameters.startDate);
    if (parameters.endDate) searchParams.append("endDate", parameters.endDate);
    if (parameters.groupBy) searchParams.append("groupBy", parameters.groupBy);
    
    const queryString = searchParams.toString();
    const url = `/api/reporting/nutrient-density-summary${queryString ? `?${queryString}` : ""}`;
    
    return apiClient.get<MacroDensitySummaryItem[]>(url);
  },
};
