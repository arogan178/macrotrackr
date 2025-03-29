import { MacroDailyTotals, MacroTargetSettings } from "../types";
import { calculateCalories } from "@/utils/nutrition";
import {
  MacroDistributionBar,
  MacroDistributionLegend,
} from "@/components/nutrition";

interface DailySummaryProps {
  macroDailyTotals?: MacroDailyTotals;
  macroDistribution?: MacroTargetSettings;
}

export default function DailySummary({
  macroDailyTotals,
  macroDistribution,
}: DailySummaryProps) {
  const defaultDistribution = {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  };

  // Create default empty values to handle undefined totals
  const safeTotal = macroDailyTotals || {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  };
  const distribution = macroDistribution || defaultDistribution;

  // Using the shared utility for calorie calculation
  const calculatedCalories = calculateCalories(
    safeTotal.protein,
    safeTotal.carbs,
    safeTotal.fats
  );
  const totalCalories = safeTotal.calories || calculatedCalories;

  const macroData = [
    {
      name: "Protein",
      grams: (safeTotal.protein || 0).toFixed(1),
      calories: Math.round(safeTotal.protein * 4),
      targetPercent: distribution.proteinPercentage,
      color: "bg-green-500",
      textColor: "text-green-400",
      borderColor: "border-green-500/20",
      gradientFrom: "from-green-900/30",
      barColor: "bg-green-500/80",
      targetBarColor: "bg-green-700/30",
    },
    {
      name: "Carbs",
      grams: (safeTotal.carbs || 0).toFixed(1),
      calories: Math.round(safeTotal.carbs * 4),
      targetPercent: distribution.carbsPercentage,
      color: "bg-blue-500",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/20",
      gradientFrom: "from-blue-900/30",
      barColor: "bg-blue-500/80",
      targetBarColor: "bg-blue-700/30",
    },
    {
      name: "Fats",
      grams: (safeTotal.fats || 0).toFixed(1),
      calories: Math.round(safeTotal.fats * 9),
      targetPercent: distribution.fatsPercentage,
      color: "bg-red-500",
      textColor: "text-red-400",
      borderColor: "border-red-500/20",
      gradientFrom: "from-red-900/30",
      barColor: "bg-red-500/80",
      targetBarColor: "bg-red-700/30",
    },
  ];

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden h-full">
      <div className="p-6 flex flex-col h-full">
        <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-200">
              Today's Summary
            </h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {totalCalories}
              </div>
              <div className="text-xs text-gray-400">Total kcal</div>
            </div>
          </div>

          {/* Using shared MacroDistributionBar component */}
          <MacroDistributionBar
            macros={{
              protein: safeTotal.protein,
              carbs: safeTotal.carbs,
              fats: safeTotal.fats,
            }}
          />

          {/* Using shared MacroDistributionLegend component */}
          <MacroDistributionLegend
            macros={{
              protein: safeTotal.protein,
              carbs: safeTotal.carbs,
              fats: safeTotal.fats,
            }}
            className="mt-2"
          />
        </div>

        <div className="space-y-4">
          {macroData.map((macro) => (
            <div
              key={macro.name}
              className={`bg-gradient-to-br ${macro.gradientFrom} to-gray-800/10 p-4 rounded-xl border ${macro.borderColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${macro.color}`}></div>
                  <h3 className={`${macro.textColor} text-sm font-medium`}>
                    {macro.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">
                    {macro.grams}g
                  </span>
                </div>
              </div>

              {/* Rest of the component remains largely the same */}
              <div className="relative h-2 rounded-full bg-gray-700/50 overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full ${macro.targetBarColor} transition-all duration-500`}
                  style={{ width: `${macro.targetPercent}%` }}
                ></div>
                <div
                  className={`absolute left-0 top-0 h-full ${macro.barColor} transition-all duration-500`}
                  style={{
                    width: `${calculateBarWidth(
                      totalCalories,
                      macro.calories,
                      macro.targetPercent
                    )}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${macro.textColor}`}>
                    {macro.calories} kcal
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-gray-400">
                    {calculateMacroPercent(totalCalories, macro.calories)}%{" "}
                  </span>
                  <span className="text-gray-500 mx-1">•</span>
                  <span className="text-gray-600">
                    Target: {macro.targetPercent}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function calculateMacroPercent(total: number, value: number): number {
  return total ? Math.round((value / total) * 100) : 0;
}

function calculateBarWidth(
  total: number,
  value: number,
  targetPercent: number
): number {
  const percent = calculateMacroPercent(total, value);
  return percent;
}
