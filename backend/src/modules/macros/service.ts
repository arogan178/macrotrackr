// src/modules/macros/service.ts
import { db } from "../../db";
import { transformKeysToCamel } from "../../lib/mappers";
import { safeQueryAll } from "../../lib/database";

interface MacroHistoryQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: "week" | "month";
}

export interface MacroHistorySummaryItem {
  period: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  count: number;
}

export async function getMacroHistory(
  userId: string,
  params: MacroHistoryQuery = {}
): Promise<MacroHistorySummaryItem[]> {
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
  const sqlParams: any[] = [userId];
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
