import { MacroDailyTotals, MacroTargetSettings } from "../types";
import { calculateCalories } from "@/utils/nutrition";
import {
  MacroDistributionBar,
  MacroDistributionLegend,
} from "@/components/nutrition";
import ProgressBar from "@/components/ProgressBar";

interface DailySummaryProps {
  macroDailyTotals?: MacroDailyTotals;
  macroDistribution?: MacroTargetSettings;
  targetCalories?: number;
}

export default function DailySummary({
  macroDailyTotals,
  macroDistribution,
  targetCalories,
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
  const dailyTargetCalories = targetCalories || totalCalories || 2000;

  // Calculate target grams for each macro based on targetCalories and distribution
  const targetProteinGrams = Math.round(
    (dailyTargetCalories * distribution.proteinPercentage) / 100 / 4
  );
  const targetCarbsGrams = Math.round(
    (dailyTargetCalories * distribution.carbsPercentage) / 100 / 4
  );
  const targetFatsGrams = Math.round(
    (dailyTargetCalories * distribution.fatsPercentage) / 100 / 9
  );

  // Calculate completion percentages for each macro
  const proteinCompletionPercent = Math.min(
    100,
    Math.round((safeTotal.protein / targetProteinGrams) * 100) || 0
  );
  const carbsCompletionPercent = Math.min(
    100,
    Math.round((safeTotal.carbs / targetCarbsGrams) * 100) || 0
  );
  const fatsCompletionPercent = Math.min(
    100,
    Math.round((safeTotal.fats / targetFatsGrams) * 100) || 0
  );
  const calorieCompletionPercent = Math.min(
    100,
    Math.round((totalCalories / dailyTargetCalories) * 100) || 0
  );

  // Calculate total calories from each macro
  const proteinCalories = Math.round(safeTotal.protein * 4);
  const carbsCalories = Math.round(safeTotal.carbs * 4);
  const fatsCalories = Math.round(safeTotal.fats * 9);
  const totalMacroCalories = proteinCalories + carbsCalories + fatsCalories;

  // Calculate actual percentages of total calories for each macro
  const proteinPercent =
    totalMacroCalories === 0
      ? 0
      : Math.round((proteinCalories / totalMacroCalories) * 100);
  const carbsPercent =
    totalMacroCalories === 0
      ? 0
      : Math.round((carbsCalories / totalMacroCalories) * 100);
  // To ensure percentages add up to 100%, calculate fats as the remaining percentage
  const fatsPercent =
    totalMacroCalories === 0 ? 0 : 100 - proteinPercent - carbsPercent;

  const macroData = [
    {
      name: "Protein",
      grams: Math.round(safeTotal.protein || 0),
      targetGrams: targetProteinGrams,
      calories: proteinCalories,
      targetPercent: distribution.proteinPercentage,
      actualPercent: proteinPercent,
      color: "bg-green-500",
      textColor: "text-green-400",
      borderColor: "border-green-500/20",
      gradientFrom: "from-green-900/30",
      barColor: "bg-green-500/80",
      targetBarColor: "bg-green-700/30",
      completionPercent: proteinCompletionPercent,
    },
    {
      name: "Carbs",
      grams: Math.round(safeTotal.carbs || 0),
      targetGrams: targetCarbsGrams,
      calories: carbsCalories,
      targetPercent: distribution.carbsPercentage,
      actualPercent: carbsPercent,
      color: "bg-blue-500",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/20",
      gradientFrom: "from-blue-900/30",
      barColor: "bg-blue-500/80",
      targetBarColor: "bg-blue-700/30",
      completionPercent: carbsCompletionPercent,
    },
    {
      name: "Fats",
      grams: Math.round(safeTotal.fats || 0),
      targetGrams: targetFatsGrams,
      calories: fatsCalories,
      targetPercent: distribution.fatsPercentage,
      actualPercent: fatsPercent,
      color: "bg-red-500",
      textColor: "text-red-400",
      borderColor: "border-red-500/20",
      gradientFrom: "from-red-900/30",
      barColor: "bg-red-500/80",
      targetBarColor: "bg-red-700/30",
      completionPercent: fatsCompletionPercent,
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
              <div className="text-xs text-gray-400">
                <span>of </span>
                <span className="font-medium text-gray-300">
                  {dailyTargetCalories}
                </span>
                <span> kcal</span>

                <span className="ml-1 font-medium text-indigo-400">
                  ({calorieCompletionPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Calories progress bar */}
          <ProgressBar
            progress={calorieCompletionPercent}
            color="indigo"
            height="md"
            className="mb-4"
          />

          {/* Using shared MacroDistributionBar component with corrected distribution values */}
          <MacroDistributionBar
            macros={{
              protein: proteinCalories,
              carbs: carbsCalories,
              fats: fatsCalories,
            }}
          />

          {/* Using shared MacroDistributionLegend component with corrected percentage values */}
          <MacroDistributionLegend
            macros={{
              protein: proteinCalories,
              carbs: carbsCalories,
              fats: fatsCalories,
            }}
            percentages={{
              protein: proteinPercent,
              carbs: carbsPercent,
              fats: fatsPercent,
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
                  <span className="text-xs text-gray-400 ml-1">
                    / {macro.targetGrams}g
                  </span>
                </div>
              </div>

              {/* Progress toward target grams */}
              <ProgressBar
                progress={macro.completionPercent}
                color={
                  macro.name.toLowerCase() === "protein"
                    ? "green"
                    : macro.name.toLowerCase() === "carbs"
                    ? "blue"
                    : "red"
                }
                height="md"
                className="mb-3"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${macro.textColor}`}>
                    {macro.calories} kcal
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`text-xs ${macro.textColor} ml-1`}>
                    {macro.completionPercent}%
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
