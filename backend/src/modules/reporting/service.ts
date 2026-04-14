// Service for nutrient density summary aggregation
import type { Database } from "bun:sqlite";
import { safeQueryAll } from "../../lib/data/database";
import { transformKeysToCamel } from "../../lib/mappers";

export interface MacroHistorySummaryItem {
  period: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  count: number;
}

interface MacroDensitySummaryParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}

export function getMacroDensitySummary({
  db,
  userId,
  startDate,
  endDate,
  groupBy = "day",
}: MacroDensitySummaryParams & { db: Database }): MacroHistorySummaryItem[] {
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
  const sqlParams: (string | number)[] = [userId];
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
