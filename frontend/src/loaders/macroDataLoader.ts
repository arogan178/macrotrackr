import { MacroDailyTotals } from "@/types/macro";
import { apiService } from "@/utils/apiServices";

import { weightGoalsLoader } from "./weightGoalsLoader";

// Route loader for macro tracking data
export async function macroDataLoader({
  startDate,
  endDate,
  limit = 20,
  offset = 0,
}: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {}) {
  try {
    // Fetch daily totals, history, weight goals, and macro targets in parallel
    // Fetch all entries from 0 to offset+limit for cumulative pagination
    const fetchLimit = offset + limit;
    const [totalsData, historyPage, weightGoalsResult, macroTargetResult] =
      await Promise.all([
        apiService.macros.getDailyTotals({ startDate, endDate }),
        apiService.macros.getHistory(fetchLimit, 0, { startDate, endDate }),
        weightGoalsLoader(),
        apiService.macros.getMacroTarget(),
      ]);

    // Format daily totals with defaults
    let macroDailyTotals: MacroDailyTotals = {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
    };

    if (totalsData && typeof totalsData === "object") {
      const data = totalsData as any;
      macroDailyTotals = {
        protein: typeof data.protein === "number" ? data.protein : 0,
        carbs: typeof data.carbs === "number" ? data.carbs : 0,
        fats: typeof data.fats === "number" ? data.fats : 0,
        calories: typeof data.calories === "number" ? data.calories : 0,
      };
    }

    // Format history data
    const historyData = historyPage as any;
    const history = Array.isArray(historyData.entries)
      ? historyData.entries
      : [];
    const historyHasMore = !!historyData.hasMore;

    // Return a flat object for easier consumption by route components
    return {
      macroDailyTotals,
      history,
      historyHasMore,
      historyTotal: historyData.total || 0,
      historyLimit: historyData.limit || 20,
      historyOffset: historyData.offset || 0,
      weightGoals: weightGoalsResult?.weightGoals ?? undefined,
      weightLog: weightGoalsResult?.weightLog ?? [],
      weightGoalsError: weightGoalsResult?.error,
      macroTarget: macroTargetResult?.macroTarget ?? undefined,
      error: undefined,
      authRequired: false,
    };
  } catch (error: any) {
    // Handle authentication errors
    if (error?.status === 401) {
      return {
        macroDailyTotals: undefined,
        history: [],
        historyHasMore: false,
        historyTotal: 0,
        historyLimit: 20,
        historyOffset: 0,
        error: undefined,
        authRequired: true,
      };
    }

    console.error("Macro data loader error:", error);
    return {
      macroDailyTotals: undefined,
      history: [],
      historyHasMore: false,
      historyTotal: 0,
      historyLimit: 20,
      historyOffset: 0,
      error: error?.message || "Failed to load macro data",
      authRequired: false,
    };
  }
}
