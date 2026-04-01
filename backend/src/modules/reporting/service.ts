// Service for nutrient density summary aggregation
import type { Database } from "bun:sqlite";
import {
  getMacroHistory,
  type MacroHistorySummaryItem,
} from "../macros/service";
// import { getGoalsForUser } from "../goals/services";

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
  // Fetch macro history for the user in the date range, grouped by week or month
  return getMacroHistory(db, userId, { startDate, endDate, groupBy });
}
