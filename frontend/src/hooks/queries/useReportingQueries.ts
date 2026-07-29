import { useQuery } from "@tanstack/react-query";

import { reportingApi } from "@/api/reporting";
import { queryConfigs } from "@/lib/queryClient";

export const reportingKeys = {
  all: ["reporting"] as const,
  densitySummary: (startDate?: string, endDate?: string, groupBy?: string) =>
    [...reportingKeys.all, "density-summary", { startDate, endDate, groupBy }] as const,
};

export function useMacroDensitySummary(
  startDate?: string,
  endDate?: string,
  groupBy?: "day" | "week" | "month"
) {
  return useQuery({
    queryKey: reportingKeys.densitySummary(startDate, endDate, groupBy),
    queryFn: async () => {
      const data = await reportingApi.getMacroDensitySummary({ startDate, endDate, groupBy });

      return data.map((item) => {
        const proteinCal = (item.protein || 0) * 4;
        const carbsCal = (item.carbs || 0) * 4;
        const fatsCal = (item.fats || 0) * 9;
        const totalMacroCalories = proteinCal + carbsCal + fatsCal;

        let label = item.period;
        if (groupBy === "day" && label.length === 10) {
          label = new Date(label + "T00:00:00").toLocaleString("en-US", {
            month: "short",
            day: "numeric",
          });
        } else if (groupBy === "month" && label.length === 7) {
          const [year, month] = label.split("-");
          label = new Date(Number(year), Number(month) - 1, 1).toLocaleString(
            "en-US",
            { month: "short" },
          );
        } else if (groupBy === "week") {
          // Just use the week string or implement week to date range formatting
          label = label.replace("-W", " Wk ");
        }

        return {
          period: label,
          calories: item.calories,
          protein:
            totalMacroCalories > 0 ? proteinCal / totalMacroCalories : 0,
          carbs: totalMacroCalories > 0 ? carbsCal / totalMacroCalories : 0,
          fats: totalMacroCalories > 0 ? fatsCal / totalMacroCalories : 0,
          proteinGrams: item.protein,
          carbsGrams: item.carbs,
          fatsGrams: item.fats,
          count: item.count,
        };
      });
    },
    enabled: !!(startDate && endDate),
    ...queryConfigs.longLived,
  });
}
