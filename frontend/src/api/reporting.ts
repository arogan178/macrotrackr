import { apiClient } from "@/api/core";

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
    const searchParameters = new URLSearchParams();
    if (parameters.startDate) searchParameters.append("startDate", parameters.startDate);
    if (parameters.endDate) searchParameters.append("endDate", parameters.endDate);
    if (parameters.groupBy) searchParameters.append("groupBy", parameters.groupBy);
    
    const queryString = searchParameters.toString();
    const url = `/api/reporting/nutrient-density-summary${queryString ? `?${queryString}` : ""}`;
    
    return apiClient.get<MacroDensitySummaryItem[]>(url);
  },
};
