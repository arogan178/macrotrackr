// Service for nutrient density summary aggregation
import { getMacroHistory } from "../macros/service";
// import { getGoalsForUser } from "../goals/services";

interface MacroDensitySummaryParams {
  userId: string;
  startDate?: string;
  endDate?: string;
  groupBy?: "week" | "month";
}

export async function getMacroDensitySummary({
  userId,
  startDate,
  endDate,
  groupBy = "week",
}: MacroDensitySummaryParams) {
  // Fetch macro history for the user in the date range, grouped by week or month
  return await getMacroHistory(userId, { startDate, endDate, groupBy });
}
