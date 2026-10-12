// Service for nutrient density summary aggregation
import type { Database } from "bun:sqlite";
import { safeQueryAll } from "../../lib/data/database";
import { transformKeysToCamel } from "../../lib/mappers";
import {
  estimateExpenditure,
  expenditureWindow,
  type ExpenditureResult,
} from "@shared/expenditure";
import { calculateTrendWeights, dayKeyAtOffset } from "@shared/trendWeight";

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

// Enough weigh-ins before the window for the trend to settle.
const TREND_LEAD_IN_DAYS = 60;

export function getExpenditure({
  db,
  userId,
  today,
  tzOffsetMinutes,
}: {
  db: Database;
  userId: number;
  today: string;
  tzOffsetMinutes: number;
}): ExpenditureResult {
  const { start, end } = expenditureWindow(today);

  const intakeRows = safeQueryAll<{ entry_date: string; calories: number }>(
    db,
    `SELECT entry_date, SUM(protein*4 + carbs*4 + fats*9) AS calories
     FROM macro_entries
     WHERE user_id = ? AND entry_date >= ? AND entry_date <= ?
     GROUP BY entry_date`,
    [userId, start, end],
  );
  const partialRows = safeQueryAll<{ entry_date: string }>(
    db,
    `SELECT entry_date FROM partial_days
     WHERE user_id = ? AND entry_date >= ? AND entry_date <= ?`,
    [userId, start, end],
  );
  // Timestamps are ISO instants or bare dates, so the day prefix compares as text.
  const leadInStart = new Date(
    Date.parse(`${start}T00:00:00Z`) - TREND_LEAD_IN_DAYS * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
  const weightRows = safeQueryAll<{ timestamp: string; weight: number }>(
    db,
    "SELECT timestamp, weight FROM weight_log WHERE user_id = ? AND timestamp >= ?",
    [userId, leadInStart],
  );

  return estimateExpenditure({
    intakeByDate: Object.fromEntries(
      intakeRows.map((row) => [row.entry_date, row.calories]),
    ),
    partialDates: partialRows.map((row) => row.entry_date),
    trend: calculateTrendWeights(weightRows, dayKeyAtOffset(tzOffsetMinutes)),
    today,
  });
}
