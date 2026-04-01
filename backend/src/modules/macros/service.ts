// src/modules/macros/service.ts
import type { Database } from "bun:sqlite";
import {
  safeQueryAll,
  type MacroEntryRow,
} from "../../lib/database";
import { ValidationError } from "../../lib/errors";
import { transformKeysToCamel } from "../../lib/mappers";
import type { FoodProductResult } from "../../lib/openfoodfacts-api-client";
import type { AuthenticatedRouteContext } from "../../types";

interface MacroHistoryQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}

export interface CacheService {
  get: <T>(key: string) => T | null | undefined;
  set: <T>(key: string, value: T) => void;
}

export interface MacrosRouteContext
  extends AuthenticatedRouteContext<Record<string, unknown>> {
  openFoodFactsApiClient?: {
    search: (query: string) => Promise<FoodProductResult[]>;
  };
  cacheService?: CacheService;
}

export interface MacroHistorySummaryItem {
  period: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  count: number;
}

export interface MacroEntryResponse {
  id: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealName?: string;
  entryDate: string;
  entryTime: string;
  ingredients?: unknown;
  createdAt: string;
}

export function parseJsonArrayField<T>(
  rawValue: string | null | undefined,
  fieldName: string,
): T[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      throw new ValidationError(`${fieldName} must be a JSON array.`);
    }

    return parsed as T[];
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(`Invalid ${fieldName} data in storage.`);
  }
}

export function normalizeMacroEntryRow(
  row: MacroEntryRow & { ingredients?: string | null },
): MacroEntryResponse {
  const normalized = transformKeysToCamel(
    row as unknown as Record<string, unknown>,
  ) as Record<string, unknown>;

  if (typeof normalized.ingredients === "string") {
    normalized.ingredients = parseJsonArrayField<Record<string, unknown>>(
      normalized.ingredients,
      "ingredients",
    );
  }

  return normalized as unknown as MacroEntryResponse;
}

export function getMacroHistory(
  db: Database,
  userId: string,
  params: MacroHistoryQuery = {}
): MacroHistorySummaryItem[] {
  const { startDate, endDate, groupBy } = params;
  let groupExpr = "entry_date";
  let selectPeriod = "entry_date as period";
  if (groupBy === "month") {
    groupExpr = "substr(entry_date, 1, 7)";
    selectPeriod = "substr(entry_date, 1, 7) as period";
  } else if (groupBy === "week") {
    groupExpr = "strftime('%Y-W%W', entry_date)";
    selectPeriod = "strftime('%Y-W%W', entry_date) as period";
  }

  let query = `SELECT ${selectPeriod}, SUM(protein) as protein, SUM(carbs) as carbs, SUM(fats) as fats, SUM(protein*4 + carbs*4 + fats*9) as calories, COUNT(*) as count FROM macro_entries WHERE user_id = ?`;
  const sqlParams: string[] = [userId];
  if (startDate) {
    query += " AND entry_date >= ?";
    sqlParams.push(startDate);
  }
  if (endDate) {
    query += " AND entry_date <= ?";
    sqlParams.push(endDate);
  }
  query += ` GROUP BY ${groupExpr} ORDER BY ${groupExpr} ASC`;

  const rows = safeQueryAll<Record<string, unknown>>(db, query, sqlParams);
  return rows.map(
    (row) =>
      transformKeysToCamel(row) as unknown as MacroHistorySummaryItem,
  );
}
