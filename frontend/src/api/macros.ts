import type { Ingredient, MacroEntry } from "@/types/macro";

import { API_BASE_URL, getHeadersAsync, handleResponse } from "@/api/core";

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

type MacroTargetSettingsPayload = {
  macroTarget: MacroTargetSettingsObject;
};

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

function normalizeFoodSearchResults(value: unknown): FoodSearchResult[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is FoodSearchResult => isFoodSearchResult(item));
}

export const macrosApi = {
  getDailyTotals: async ({
    startDate,
    endDate,
  }: { startDate?: string; endDate?: string } = {}) => {
    let url = `${API_BASE_URL}/api/macros/totals`;
    const parameters = [];
    if (startDate) parameters.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) parameters.push(`endDate=${encodeURIComponent(endDate)}`);
    if (parameters.length > 0) url += `?${parameters.join("&")}`;
    const response = await fetch(url, {
      headers: await getHeadersAsync(false),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getHistory: async (
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
        pageSize,
        offset,
        options,
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

  addEntry: async (entry: MacroEntryCreatePayload) => {
    const payload = {
      protein: entry.protein,
      carbs: entry.carbs,
      fats: entry.fats,
      mealType: entry.mealType,
      mealName: entry.mealName || "",
      entryDate: entry.entryDate,
      entryTime: entry.entryTime,
      ingredients: entry.ingredients,
    };
    const response = await fetch(`${API_BASE_URL}/api/macros`, {
      method: "POST",
      headers: await getHeadersAsync(),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return handleResponse(response);
  },

  updateEntry: async (id: number, entry: MacroEntryUpdatePayload) => {
    const payload: MacroEntryUpdatePayload = {};
    if (entry.protein !== undefined) payload.protein = entry.protein;
    if (entry.carbs !== undefined) payload.carbs = entry.carbs;
    if (entry.fats !== undefined) payload.fats = entry.fats;
    if (entry.mealType !== undefined) payload.mealType = entry.mealType;
    if (entry.mealName !== undefined) payload.mealName = entry.mealName;
    if (entry.entryDate !== undefined) payload.entryDate = entry.entryDate;
    if (entry.entryTime !== undefined) payload.entryTime = entry.entryTime;
    if (entry.ingredients !== undefined) payload.ingredients = entry.ingredients;
    const response = await fetch(`${API_BASE_URL}/api/macros/${id}`, {
      method: "PUT",
      headers: await getHeadersAsync(),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return handleResponse(response);
  },

  deleteEntry: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/macros/${id}`, {
      method: "DELETE",
      headers: await getHeadersAsync(false),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getMacroTarget: async (): Promise<MacroTargetGetResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/macros/target`, {
      headers: await getHeadersAsync(false),
      credentials: "include",
    });
    return (await handleResponse(response)) as MacroTargetGetResponse;
  },

  saveMacroTargetPercentages: async (payload: MacroTargetSettingsPayload) => {
    if (payload?.macroTarget === undefined) {
      throw new Error("Invalid payload: macroTarget object is required.");
    }
    const response = await fetch(`${API_BASE_URL}/api/macros/target`, {
      method: "PUT",
      headers: await getHeadersAsync(),
      body: JSON.stringify({ macroTarget: payload.macroTarget }),
      credentials: "include",
    });
    return handleResponse(response);
  },

  search: async (query: string): Promise<FoodSearchResult[]> => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      return [];
    }
    const response = await fetch(
      `${API_BASE_URL}/api/macros/search?q=${encodeURIComponent(normalizedQuery)}`,
      {
        headers: await getHeadersAsync(false),
        credentials: "include",
      },
    );
    return normalizeFoodSearchResults(await handleResponse(response));
  },
};
