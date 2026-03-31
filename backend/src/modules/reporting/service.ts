// Service for nutrient density summary aggregation
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

export async function getMacroDensitySummary({
  userId,
  startDate,
  endDate,
  groupBy = "day",
}: MacroDensitySummaryParams): Promise<MacroHistorySummaryItem[]> {
  // Fetch macro history for the user in the date range, grouped by week or month
  return await getMacroHistory(userId, { startDate, endDate, groupBy });
}
