import { apiClient } from "@/api/core";
import type { Ingredient, MacroEntry } from "@/types/macro";

export interface FoodSearchResult {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  energyKcal: number;
  categories: string;
  servingQuantity: number;
  servingUnit: string;
  rawQuantity?: string;
}

export interface MacroEntryCreatePayload {
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealName?: string;
  entryDate: string;
  entryTime: string;
  ingredients?: Ingredient[];
}

export type MacroEntryUpdatePayload = Partial<MacroEntryCreatePayload>;

export interface MacroEntryDeleteResponse {
  success: boolean;
  id: number;
}

export interface MacroHistoryOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

interface MacroHistoryResponse {
  entries: MacroEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  limits?: unknown;
}

type MacroTargetSettingsObject =
  | {
      proteinPercentage: number;
      carbsPercentage: number;
      fatsPercentage: number;
      lockedMacros?: Array<"protein" | "carbs" | "fats">;
    }
  | undefined;

interface MacroTargetSettingsPayload {
  macroTarget: MacroTargetSettingsObject;
}

type MacroTargetGetResponse =
  | {
      macroTarget: MacroTargetSettingsObject;
    }
  | undefined;

function isFoodSearchResult(value: unknown): value is FoodSearchResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.protein === "number" &&
    typeof candidate.carbs === "number" &&
    typeof candidate.fats === "number" &&
    typeof candidate.energyKcal === "number" &&
    typeof candidate.categories === "string" &&
    typeof candidate.servingQuantity === "number" &&
    typeof candidate.servingUnit === "string" &&
    (candidate.rawQuantity === undefined || typeof candidate.rawQuantity === "string")
  );
}

export function normalizeFoodSearchResults(value: unknown): FoodSearchResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is FoodSearchResult => isFoodSearchResult(item));
}

export const macrosApi = {
  /**
   * @throws {ApiError}
   */
  getDailyTotals: async ({
    startDate,
    endDate,
  }: { startDate?: string; endDate?: string } = {}) => {
    const searchParameters = new URLSearchParams();
    if (startDate) searchParameters.append("startDate", startDate);
    if (endDate) searchParameters.append("endDate", endDate);
    
    const queryString = searchParameters.toString();
    const url = `/api/macros/totals${queryString ? `?${queryString}` : ""}`;
    
    return apiClient.get<unknown>(url);
  },

  /**
   * @throws {ApiError}
   */
  getHistory: async (
    options: MacroHistoryOptions = {},
  ) => {
    const { limit = 20, offset = 0, startDate, endDate } = options;
    const searchParameters = new URLSearchParams();
    searchParameters.append("limit", limit.toString());
    searchParameters.append("offset", offset.toString());
    if (startDate) searchParameters.append("startDate", startDate);
    if (endDate) searchParameters.append("endDate", endDate);
    
    const url = `/api/macros/history?${searchParameters.toString()}`;

    return apiClient.get<unknown>(url);
  },

  /**
   * @throws {ApiError}
   */
  getAllHistory: async (
    options: { startDate?: string; endDate?: string } = {},
  ): Promise<{ entries: MacroEntry[]; limits?: unknown }> => {
    const pageSize = 100;
    let offset = 0;
    let hasMore = true;
    const entries: MacroEntry[] = [];
    let limits: unknown;

    while (hasMore) {
      const response = (await macrosApi.getHistory(
        { limit: pageSize, offset, ...options },
      )) as MacroHistoryResponse;

      if (Array.isArray(response.entries)) {
        entries.push(...response.entries);
      }

      limits = response.limits ?? limits;
      hasMore = response.hasMore === true;
      offset += pageSize;

      if (offset > 50_000) {
        break;
      }
    }

    return { entries, limits };
  },

  /**
   * @throws {ApiError}
   */
  addEntry: async (entry: MacroEntryCreatePayload) => {
    const payload = {
      protein: entry.protein,
      carbs: entry.carbs,
      fats: entry.fats,
      mealType: entry.mealType,
      mealName: entry.mealName ?? "",
      entryDate: entry.entryDate,
      entryTime: entry.entryTime,
      ingredients: entry.ingredients,
    };
    
    return apiClient.post<unknown>("/api/macros", payload);
  },

  /**
   * @throws {ApiError}
   */
  updateEntry: async ({ id, data }: { id: number; data: MacroEntryUpdatePayload }) => {
    const payload: MacroEntryUpdatePayload = {};
    const entry = data;
    if (entry.protein !== undefined) payload.protein = entry.protein;
    if (entry.carbs !== undefined) payload.carbs = entry.carbs;
    if (entry.fats !== undefined) payload.fats = entry.fats;
    if (entry.mealType !== undefined) payload.mealType = entry.mealType;
    if (entry.mealName !== undefined) payload.mealName = entry.mealName;
    if (entry.entryDate !== undefined) payload.entryDate = entry.entryDate;
    if (entry.entryTime !== undefined) payload.entryTime = entry.entryTime;
    if (entry.ingredients !== undefined) payload.ingredients = entry.ingredients;
    
    return apiClient.put<unknown>(`/api/macros/${id}`, payload);
  },

  /**
   * @throws {ApiError}
   */
  deleteEntry: async ({ id }: { id: number }): Promise<MacroEntryDeleteResponse> => {
    return apiClient.del<MacroEntryDeleteResponse>(`/api/macros/${id}`);
  },

  /**
   * @throws {ApiError}
   */
  getMacroTarget: async (): Promise<MacroTargetGetResponse> => {
    return apiClient.get<MacroTargetGetResponse>("/api/macros/target");
  },

  /**
   * @throws {ApiError}
   */
  saveMacroTargetPercentages: async (payload: MacroTargetSettingsPayload) => {
    if (payload.macroTarget === undefined) {
      throw new Error("Invalid payload: macroTarget object is required.");
    }

    return apiClient.put<unknown>("/api/macros/target", { macroTarget: payload.macroTarget });
  },

  /**
   * @throws {ApiError}
   */
  search: async ({ query }: { query: string }): Promise<FoodSearchResult[]> => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      return [];
    }
    
    const response = await apiClient.get<unknown>(`/api/macros/search?q=${encodeURIComponent(normalizedQuery)}`);

    return normalizeFoodSearchResults(response);
  },
};
