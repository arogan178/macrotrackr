import {
  CalorieIcon,
  ChevronRightIcon,
  EditIcon,
  TrashIcon, // Import TrashIcon
} from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import {
  MacroDailyTotals,
  MacroTargetSettings,
} from "@/features/macroTracking/types";
import { WeightGoals } from "../types";
import MacroNutrient from "./MacroNutrient";

interface WeightGoalStatusProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | null;
  onEdit: () => void;
  onDelete: () => void; // Add onDelete prop
  calorieTarget?: number;
  macroTarget?: MacroTargetSettings;
}

function WeightGoalStatus({
  startingWeight,
  targetWeight,
  tdee,
  macroDailyTotals,
  weightGoals,
  onEdit,
  onDelete, // Destructure onDelete
  calorieTarget,
  macroTarget,
}: WeightGoalStatusProps) {
  // Use the provided macro target or fall back to default
  const target = macroTarget || {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  };

  // Calculate progress percentage
  const weightDifference = Math.abs(targetWeight - startingWeight);
  const initialDifference = Math.abs(
    targetWeight - (weightGoals?.startingWeight || startingWeight)
  );
  const progressPercentage =
    initialDifference > 0
      ? Math.min(
          100,
          Math.round(
            ((initialDifference - weightDifference) / initialDifference) * 100
          )
        )
      : 0;

  // Determine if it's a weight loss, gain, or maintenance goal
  const weightGoal = weightGoals?.weightGoal || "maintain";
  const isWeightLoss = weightGoal === "lose";
  const isWeightGain = weightGoal === "gain";
  const isMaintenance = weightGoal === "maintain";

  // Use the provided calorie target or fall back to weight goals target or tdee
  const effectiveCalorieTarget =
    calorieTarget || weightGoals?.calorieTarget || tdee;

  // For display
  const goalTypeLabel = isWeightLoss
    ? "Weight Loss"
    : isWeightGain
    ? "Weight Gain"
    : "Weight Maintenance";

  const goalColor = isWeightLoss ? "indigo" : isWeightGain ? "green" : "blue";

  // Format dates for display
  const formattedStartDate = weightGoals?.startDate
    ? new Date(weightGoals.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Today";

  const formattedTargetDate = weightGoals?.targetDate
    ? new Date(weightGoals.targetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";

  // Calculate target grams for each macro based on target calories and target
  const targetProteinGrams = Math.round(
    (effectiveCalorieTarget * target.proteinPercentage) / 100 / 4
  );
  const targetCarbsGrams = Math.round(
    (effectiveCalorieTarget * target.carbsPercentage) / 100 / 4
  );
  const targetFatsGrams = Math.round(
    (effectiveCalorieTarget * target.fatsPercentage) / 100 / 9
  );

  // Get weekly change with fallback
  const weeklyChange = weightGoals?.weeklyChange || 0;

  // Get calculated weeks with fallback
  const calculatedWeeks = weightGoals?.calculatedWeeks || 0;

  return (
    <div className="p-6">
      {/* Header with goal type and edit/delete buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg bg-${goalColor}-600/20 mr-3`}>
            <CalorieIcon className={`w-5 h-5 text-${goalColor}-400`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-200">
              {goalTypeLabel} Plan
            </h2>
            <p className="text-sm text-gray-400">
              Started {formattedStartDate} • Target {formattedTargetDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {" "}
          {/* Add gap for buttons */}
          <button
            onClick={onEdit}
            className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-700 transition-colors"
            aria-label="Edit weight goal"
          >
            <EditIcon className="text-gray-300" />
          </button>
          <button
            onClick={onDelete} // Call onDelete handler
            className="p-2 rounded-full bg-red-900/30 hover:bg-red-900/50 transition-colors"
            aria-label="Delete weight goal"
          >
            <TrashIcon className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Goal progress visual */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
          <div className="flex items-baseline space-x-3 mb-2 md:mb-0">
            <span className="text-2xl font-bold text-gray-200">
              {startingWeight} kg
            </span>
            {!isMaintenance && (
              <>
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                <span className="text-xl text-gray-400">{targetWeight} kg</span>
                <span className={`text-${goalColor}-400 ml-1 text-sm`}>
                  ({isWeightLoss ? "-" : "+"}
                  {Math.abs(targetWeight - startingWeight).toFixed(1)} kg)
                </span>
              </>
            )}
          </div>
          {!isMaintenance && (
            <div className="flex items-center">
              <div className="w-16 h-16 relative rounded-full flex items-center justify-center bg-gray-700/50">
                <div className="absolute inset-0">
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="6"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      fill="none"
                      stroke={isWeightLoss ? "#6366F1" : "#10B981"}
                      strokeWidth="6"
                      strokeDasharray="150.8"
                      strokeDashoffset={
                        150.8 - (150.8 * progressPercentage) / 100
                      }
                      transform="rotate(-90 32 32)"
                    />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-200">
                  {progressPercentage}%
                </span>
              </div>
            </div>
          )}
        </div>

        {!isMaintenance && (
          <>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full bg-${goalColor}-500`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                Start: {weightGoals?.startingWeight || startingWeight} kg
              </span>
              <span>Target: {targetWeight} kg</span>
            </div>
          </>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Weekly Rate */}
        <div className="bg-gray-700/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Weekly Rate</p>
          <p className="text-lg font-medium text-gray-200">
            {isMaintenance
              ? "Maintain weight"
              : `${isWeightLoss ? "-" : "+"}${Math.abs(weeklyChange).toFixed(
                  2
                )} kg/week`}
          </p>
        </div>

        {/* Time Remaining */}
        <div className="bg-gray-700/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Time Remaining</p>
          <p className="text-lg font-medium text-gray-200">
            {isMaintenance ? "Ongoing" : `${calculatedWeeks} weeks`}
          </p>
        </div>

        {/* Daily Deficit/Surplus */}
        <div className="bg-gray-700/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">
            {isWeightLoss
              ? "Daily Deficit"
              : isWeightGain
              ? "Daily Surplus"
              : "TDEE"}
          </p>
          <p className="text-lg font-medium text-gray-200">
            {isMaintenance
              ? `${tdee} kcal`
              : `${Math.abs(tdee - (weightGoals?.calorieTarget || tdee))} kcal`}
          </p>
        </div>
      </div>

      {/* Nutrition section */}
      <div className="mb-2">
        <h3 className="font-medium text-gray-200 mb-3">Daily Nutrition</h3>

        {/* Calories progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <CalorieIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-200">Calories</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-200">
                {Math.round(macroDailyTotals.calories)}
              </span>
              <span className="text-gray-500"> / </span>
              <span className="text-gray-400">
                {Math.round(effectiveCalorieTarget)}
              </span>
            </div>
          </div>
          <ProgressBar
            progress={Math.min(
              Math.round(
                (macroDailyTotals.calories / effectiveCalorieTarget) * 100
              ),
              100
            )}
            color="indigo"
            height="sm"
          />
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Protein */}
          <MacroNutrient
            label="Protein"
            current={macroDailyTotals.protein}
            target={targetProteinGrams}
            color="green"
          />

          {/* Carbs */}
          <MacroNutrient
            label="Carbs"
            current={macroDailyTotals.carbs}
            target={targetCarbsGrams}
            color="blue"
          />

          {/* Fats */}
          <MacroNutrient
            label="Fats"
            current={macroDailyTotals.fats}
            target={targetFatsGrams}
            color="red"
          />
        </div>
      </div>
    </div>
  );
}

export default WeightGoalStatus;
