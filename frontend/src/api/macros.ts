import { api, unwrap } from "@/api/core";
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

export interface MacroEntryWrite {
  clientId: string;
  clientUpdatedAt: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealName?: string;
  entryDate: string;
  entryTime: string;
  ingredients?: Ingredient[];
}

function toWritePayload(entry: MacroEntryWrite) {
  return {
    clientId: entry.clientId,
    clientUpdatedAt: entry.clientUpdatedAt,
    protein: entry.protein,
    carbs: entry.carbs,
    fats: entry.fats,
    mealType: entry.mealType,
    mealName: entry.mealName ?? "",
    entryDate: entry.entryDate,
    entryTime: entry.entryTime,
    ingredients: entry.ingredients,
  };
}

export interface MacroHistoryOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  /** Skips the free-plan history window. Only for the delete-account export. */
  fullExport?: boolean;
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

// The backend types ingredients as unknown[]; it stores what the client sent.
const toMacroEntry = (entry: Omit<MacroEntry, "ingredients"> & { ingredients: unknown[] }) =>
  ({ ...entry, ingredients: entry.ingredients as Ingredient[] }) satisfies MacroEntry;

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
    return unwrap(api.api.macros.totals.get({ query: { startDate, endDate } }));
  },

  /**
   * @throws {ApiError}
   */
  getHistory: async (
    options: MacroHistoryOptions = {},
  ): Promise<MacroHistoryResponse> => {
    const { limit = 20, offset = 0, startDate, endDate, fullExport } = options;
    const { entries, ...rest } = await unwrap(
      api.api.macros.history.get({
        query: {
          limit,
          offset,
          startDate,
          endDate,
          fullExport: fullExport ? "true" : undefined,
        },
      }),
    );

    return { ...rest, entries: entries.map(toMacroEntry) };
  },

  /**
   * @throws {ApiError}
   */
  getAllHistory: async (
    options: { startDate?: string; endDate?: string; fullExport?: boolean } = {},
  ): Promise<{ entries: MacroEntry[]; limits?: unknown }> => {
    const pageSize = 100;
    const maxOffset = 50_000;
    const firstPage = await macrosApi.getHistory({
      limit: pageSize,
      offset: 0,
      ...options,
    });

    const entries: MacroEntry[] = Array.isArray(firstPage.entries)
      ? [...firstPage.entries]
      : [];
    let limits: unknown = firstPage.limits;

    if (firstPage.hasMore !== true) {
      return { entries, limits };
    }

    // Fetch remaining pages in parallel in small batches once page 1 tells us
    // the total count, instead of waiting for every page serially.
    const total =
      typeof firstPage.total === "number" && firstPage.total > pageSize
        ? Math.min(firstPage.total, maxOffset)
        : 0;

    if (total > pageSize) {
      const offsets: number[] = [];
      for (let offset = pageSize; offset < total; offset += pageSize) {
        offsets.push(offset);
      }

      const CONCURRENCY = 4;
      for (let index = 0; index < offsets.length; index += CONCURRENCY) {
        const batch = offsets.slice(index, index + CONCURRENCY);
        const pages = await Promise.all(
          batch.map((offset) =>
            macrosApi.getHistory({ limit: pageSize, offset, ...options }),
          ),
        );
        for (const page of pages) {
          if (Array.isArray(page.entries)) {
            entries.push(...page.entries);
          }
          limits = page.limits ?? limits;
        }
      }

      return { entries, limits };
    }

    let offset = pageSize;
    let hasMore = true;
    while (hasMore && offset <= maxOffset) {
      const response = await macrosApi.getHistory({
        limit: pageSize,
        offset,
        ...options,
      });
      if (Array.isArray(response.entries)) {
        entries.push(...response.entries);
      }
      limits = response.limits ?? limits;
      hasMore = response.hasMore === true;
      offset += pageSize;
    }

    return { entries, limits };
  },

  /**
   * Repeats of the same clientId return the stored entry.
   * @throws {ApiError}
   */
  addEntry: async (entry: MacroEntryWrite): Promise<MacroEntry> => {
    return toMacroEntry(await unwrap(api.api.macros.post(toWritePayload(entry))));
  },

  /**
   * Ignored by the server when a newer edit of the entry has already landed.
   * @throws {ApiError}
   */
  replaceEntry: async (entry: MacroEntryWrite): Promise<MacroEntry> => {
    return toMacroEntry(
      await unwrap(
        api.api.macros["by-client-id"]({ clientId: entry.clientId }).put(toWritePayload(entry)),
      ),
    );
  },

  /**
   * Succeeds when the entry is already gone.
   * @throws {ApiError}
   */
  deleteEntry: async (clientId: string): Promise<{ success: boolean; clientId: string }> => {
    return unwrap(api.api.macros["by-client-id"]({ clientId }).delete());
  },

  /**
   * Days in the range the user marked as partly logged.
   * @throws {ApiError}
   */
  getPartialDays: async (
    startDate: string,
    endDate: string,
  ): Promise<{ dates: string[] }> => {
    return unwrap(
      api.api.macros["partial-days"].get({ query: { startDate, endDate } }),
    );
  },

  /**
   * Idempotent: marking a marked day, or clearing a clear one, changes nothing.
   * @throws {ApiError}
   */
  setPartialDay: async (date: string, partial: boolean) => {
    return unwrap(api.api.macros["partial-days"]({ date }).put({ partial }));
  },

  /**
   * @throws {ApiError}
   */
  getMacroTarget: async (): Promise<MacroTargetGetResponse> => {
    return unwrap(api.api.macros.target.get());
  },

  /**
   * @throws {ApiError}
   */
  saveMacroTargetPercentages: async (payload: MacroTargetSettingsPayload) => {
    if (payload.macroTarget === undefined) {
      throw new Error("Invalid payload: macroTarget object is required.");
    }

    return unwrap(api.api.macros.target.put({ macroTarget: payload.macroTarget }));
  },

  /**
   * @throws {ApiError}
   */
  search: async ({ query }: { query: string }): Promise<FoodSearchResult[]> => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      return [];
    }

    return unwrap(api.api.macros.search.get({ query: { q: normalizedQuery } }));
  },

  /**
   * @throws {ApiError}
   */
  getByBarcode: async (barcode: string): Promise<FoodSearchResult | null> => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) {
      return null;
    }

    return unwrap(
      api.api.macros.barcode({ barcode: encodeURIComponent(cleanBarcode) }).get(),
    );
  },

  /**
   * Bulk import parsed or raw macro entries and weight records
   * @throws {ApiError}
   */
  importData: async (payload: {
    source?: string;
    entries?: Array<{
      protein: number;
      carbs: number;
      fats: number;
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      mealName?: string;
      entryDate: string;
      entryTime?: string;
      ingredients?: unknown[];
    }>;
    weightLogs?: Array<{ timestamp: string; weight: number }>;
    rawData?: string;
  }): Promise<{
    success: boolean;
    importedCount: {
      macros: number;
      weightLogs: number;
    };
    dateRange: {
      start: string;
      end: string;
    } | null;
    message: string;
  }> => {
    return unwrap(api.api.macros.import.post(payload));
  },
};
