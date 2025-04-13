import {
  CalorieIcon,
  ChevronRightIcon,
  EditIcon,
  TrashIcon,
  WeightIcon,
  CalendarIcon, // Added for Time Remaining
  TrendingUpIcon, // Added for Weekly Rate
  TargetIcon, // Added for Daily Deficit/Surplus
} from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import {
  MacroDailyTotals,
  MacroTargetSettings,
} from "@/features/macroTracking/types";
import { WeightGoals } from "../types";
import MacroNutrient from "./MacroNutrient";
import { motion } from "motion/react"; // Import motion
import React from "react"; // Import React for useEffect

interface WeightGoalStatusProps {
  startingWeight: number; // This should represent the *current* weight
  targetWeight: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | null; // This object holds the specific goal details
  onEdit: () => void;
  onDelete: () => void;
  onLogWeight: () => void;
  targetCalories?: number;
  macroTarget?: MacroTargetSettings;
}

// Helper to calculate progress percentage safely
function calculateProgress(
  current: number,
  start: number,
  target: number
): number {
  if (start === target) return 0; // Avoid division by zero if start equals target
  const totalDifference = Math.abs(target - start);
  const currentDifference = Math.abs(target - current);
  // Ensure progress doesn't exceed 100% or go below 0%
  const progress = Math.max(
    0,
    Math.min(
      100,
      ((totalDifference - currentDifference) / totalDifference) * 100
    )
  );
  return Math.round(progress);
}

// Helper to format dates
function formatDate(
  dateString: string | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return "Not set";
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", {
    ...defaultOptions,
    ...options,
  });
}

function WeightGoalStatus({
  startingWeight, // Current weight, potentially updated from logs
  targetWeight,
  tdee,
  macroDailyTotals,
  weightGoals,
  onEdit,
  onDelete,
  onLogWeight,
  targetCalories,
  macroTarget,
}: WeightGoalStatusProps) {
  // Use the starting weight *from the goal object* if the goal exists.
  // Otherwise, fall back to the current weight (though this case might indicate no active goal).
  const goalStartingWeight = weightGoals?.startingWeight ?? startingWeight;

  // Progress should be calculated based on the *current* weight vs the goal's start/target.
  const progressPercentage = calculateProgress(
    startingWeight, // Use the current weight for progress calculation
    goalStartingWeight, // Use the goal's defined starting weight
    targetWeight
  );

  const weightGoal = weightGoals?.weightGoal || "maintain";
  const isWeightLoss = weightGoal === "lose";
  const isWeightGain = weightGoal === "gain";
  const isMaintenance = weightGoal === "maintain";

  const effectiveCalorieTarget =
    targetCalories || weightGoals?.calorieTarget || tdee;

  const goalTypeLabel = isWeightLoss
    ? "Weight Loss"
    : isWeightGain
    ? "Weight Gain"
    : "Maintenance";

  const goalColor = isWeightLoss ? "indigo" : isWeightGain ? "green" : "blue";
  const goalTextColor = `text-${goalColor}-400`;
  const goalBgColorLight = `bg-${goalColor}-600/10`; // Lighter background
  const goalBgColorHover = `bg-${goalColor}-600/20`; // Slightly darker on hover
  const goalBorderColor = `border-${goalColor}-500`;
  const goalRingColor = `ring-${goalColor}-500`;

  const formattedStartDate = formatDate(weightGoals?.startDate);
  const formattedTargetDate = formatDate(weightGoals?.targetDate, {
    year: "numeric",
  });

  // Use provided macro target or default percentages
  const targetPercentages = macroTarget || {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  };

  const targetProteinGrams = Math.round(
    (effectiveCalorieTarget * targetPercentages.proteinPercentage) / 100 / 4
  );
  const targetCarbsGrams = Math.round(
    (effectiveCalorieTarget * targetPercentages.carbsPercentage) / 100 / 4
  );
  const targetFatsGrams = Math.round(
    (effectiveCalorieTarget * targetPercentages.fatsPercentage) / 100 / 9
  );

  const weeklyChange = weightGoals?.weeklyChange || 0;
  const calculatedWeeks = weightGoals?.calculatedWeeks || 0;
  const dailyDifference = Math.abs(tdee - (weightGoals?.calorieTarget || tdee));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-lg"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <div className={`p-2.5 rounded-lg ${goalBgColorLight} mr-3`}>
            {/* Use WeightIcon for weight goals */}
            <WeightIcon className={`w-6 h-6 ${goalTextColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              {goalTypeLabel} Plan
            </h2>
            <p className="text-sm text-gray-400">
              {formattedStartDate} → {formattedTargetDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={onLogWeight}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
            aria-label="Log current weight"
          >
            <WeightIcon className="h-4 w-4" />
            <span>Log Weight</span>
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-full text-gray-400 hover:text-gray-100 bg-gray-700/50 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
            aria-label="Edit weight goal"
          >
            <EditIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-full text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
            aria-label="Delete weight goal"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal Progress Visual */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
          <div className="flex items-baseline space-x-2">
            {/* Display the CURRENT weight */}
            <span className="text-2xl font-bold text-gray-100">
              {startingWeight.toFixed(1)} kg
            </span>
            {!isMaintenance && (
              <>
                <ChevronRightIcon className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xl text-gray-400">
                  {targetWeight.toFixed(1)} kg
                </span>
                {/* Display the difference relative to the GOAL's starting weight */}
                <span className={`${goalTextColor} ml-1 text-sm font-medium`}>
                  ({isWeightLoss ? "↓" : "↑"}
                  {Math.abs(targetWeight - goalStartingWeight).toFixed(1)} kg
                  goal)
                </span>
              </>
            )}
            {isMaintenance && (
              <span className="text-lg text-gray-400">Maintaining Weight</span>
            )}
          </div>
          {!isMaintenance && (
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-sm text-gray-400">Progress:</span>
              <span className="text-lg font-semibold text-gray-100">
                {progressPercentage}%
              </span>
            </div>
          )}
        </div>

        {!isMaintenance && (
          <>
            <ProgressBar
              progress={progressPercentage} // Use the calculated progress
              color={goalColor}
              height="md"
              showLabel={false}
              className="mb-1"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              {/* Display the GOAL's starting weight here */}
              <span>Start: {goalStartingWeight.toFixed(1)} kg</span>
              <span>Target: {targetWeight.toFixed(1)} kg</span>
            </div>
          </>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Weekly Rate */}
        <div
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg p-3 border ${goalBorderColor}/30`}
        >
          <TrendingUpIcon
            className={`w-5 h-5 ${goalTextColor} mt-0.5 shrink-0`}
          />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Weekly Rate</p>
            <p className="text-base font-medium text-gray-100">
              {isMaintenance
                ? "Maintenance"
                : `${isWeightLoss ? "↓" : "↑"} ${Math.abs(weeklyChange).toFixed(
                    2
                  )} kg/week`}
            </p>
          </div>
        </div>

        {/* Time Remaining */}
        <div
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg p-3 border ${goalBorderColor}/30`}
        >
          <CalendarIcon
            className={`w-5 h-5 ${goalTextColor} mt-0.5 shrink-0`}
          />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Est. Duration</p>
            <p className="text-base font-medium text-gray-100">
              {isMaintenance ? "Ongoing" : `${calculatedWeeks} weeks`}
            </p>
          </div>
        </div>

        {/* Daily Deficit/Surplus */}
        <div
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg p-3 border ${goalBorderColor}/30`}
        >
          <TargetIcon className={`w-5 h-5 ${goalTextColor} mt-0.5 shrink-0`} />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              {isWeightLoss
                ? "Daily Deficit"
                : isWeightGain
                ? "Daily Surplus"
                : "Est. TDEE"}
            </p>
            <p className="text-base font-medium text-gray-100">
              {isMaintenance ? `${tdee} kcal` : `${dailyDifference} kcal`}
            </p>
          </div>
        </div>
      </div>

      {/* Nutrition section */}
      <div>
        <h3 className="font-semibold text-lg text-gray-100 mb-4">
          Daily Nutrition Target
        </h3>

        {/* Calories progress */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <CalorieIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-gray-200">
                Calories
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-100">
                {Math.round(macroDailyTotals.calories)}
              </span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-gray-400">
                {Math.round(effectiveCalorieTarget)} kcal
              </span>
            </div>
          </div>
          <ProgressBar
            progress={Math.min(
              100, // Cap progress at 100% visually
              effectiveCalorieTarget > 0
                ? Math.round(
                    (macroDailyTotals.calories / effectiveCalorieTarget) * 100
                  )
                : 0
            )}
            color="indigo"
            height="sm"
          />
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MacroNutrient
            label="Protein"
            current={macroDailyTotals.protein}
            target={targetProteinGrams}
            color="green"
          />
          <MacroNutrient
            label="Carbs"
            current={macroDailyTotals.carbs}
            target={targetCarbsGrams}
            color="blue"
          />
          <MacroNutrient
            label="Fats"
            current={macroDailyTotals.fats}
            target={targetFatsGrams}
            color="red"
          />
        </div>
      </div>
    </motion.div>
  );
}

export default WeightGoalStatus;
