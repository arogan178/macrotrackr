import { API_BASE_URL, getHeaders, handleResponse } from "@/api/core";

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
  getMacroDensitySummary: async (
    parameters: MacroDensitySummaryParameters = {},
  ): Promise<MacroDensitySummaryItem[]> => {
    const url = new URL(
      `${API_BASE_URL}/api/reporting/nutrient-density-summary`,
    );
    if (parameters.startDate)
      url.searchParams.append("startDate", parameters.startDate);
    if (parameters.endDate)
      url.searchParams.append("endDate", parameters.endDate);
    if (parameters.groupBy)
      url.searchParams.append("groupBy", parameters.groupBy);
    const response = await fetch(url.toString(), {
      headers: await getHeaders(false),
      credentials: "include",
    });

    return (await handleResponse(response)) as MacroDensitySummaryItem[];
  },
};
