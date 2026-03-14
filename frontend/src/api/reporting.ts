import type { MacroEntry } from "@/types/macro";

import { API_BASE_URL, getHeadersAsync, handleResponse } from "@/api/core";

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

export interface MacroHistoryResponse {
  entries: MacroEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  limits?: unknown;
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
      headers: await getHeadersAsync(false),
      credentials: "include",
    });
    return (await handleResponse(response)) as MacroDensitySummaryItem[];
  },

  getMacroHistory: async (
    limit = 20,
    offset = 0,
    { startDate, endDate }: { startDate?: string; endDate?: string } = {},
  ) => {
    let url = `${API_BASE_URL}/api/macros/history?limit=${limit}&offset=${offset}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    const response = await fetch(url, {
      headers: await getHeadersAsync(false),
      credentials: "include",
    });
    return handleResponse(response);
  },
};
