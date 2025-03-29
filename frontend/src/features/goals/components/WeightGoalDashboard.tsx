import { useState, useEffect } from "react";
import { NumberField, FormButton } from "@/components/form";
import {
  EditIcon,
  GoalsIcon,
  CalorieIcon,
  ChevronRightIcon,
} from "@/components/Icons";
import { WeightGoalFormValues, WeightGoals } from "../types";
import { generateWeightGoalCalculations } from "../calculations";
import ProgressBar from "../../../components/ProgressBar";
import { MacroDailyTotals } from "@/features/macroTracking/types";

interface WeightGoalDashboardProps {
  currentWeight: number;
  targetWeight: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | null;
  isLoading?: boolean;
  onSave: (values: WeightGoalFormValues) => void;
  className?: string;
}

function WeightGoalDashboard({
  currentWeight,
  targetWeight,
  tdee,
  macroDailyTotals,
  weightGoals,
  isLoading = false,
  onSave,
  className = "",
}: WeightGoalDashboardProps) {
  // Get today's date in YYYY-MM-DD format for the starting date
  const todayString = new Date().toISOString().split("T")[0];

  const [isEditing, setIsEditing] = useState(!weightGoals);
  const [formValues, setFormValues] = useState<WeightGoalFormValues>({
    currentWeight,
    targetWeight: targetWeight || undefined,
    startDate: todayString,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [calorieIntake, setCalorieIntake] = useState<number | undefined>(
    weightGoals?.adjustedCalorieIntake
  );
  const [calculatedTargetDate, setCalculatedTargetDate] = useState<
    string | undefined
  >(weightGoals?.targetDate);
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<
    number | undefined
  >(weightGoals?.weeklyChange);
  const [calculatedWeeks, setCalculatedWeeks] = useState<number | undefined>(
    weightGoals?.calculatedWeeks
  );

  // Calculate default calorie intake based on TDEE and weight goals
  useEffect(() => {
    if (tdee && formValues.currentWeight && formValues.targetWeight) {
      const calculations = generateWeightGoalCalculations(
        tdee,
        formValues.currentWeight,
        formValues.targetWeight
      );
      setCalorieIntake(calculations.adjustedCalorieIntake);
      setCalculatedTargetDate(calculations.targetDate);
      setWeeklyWeightChange(calculations.weeklyChange);
      setCalculatedWeeks(calculations.calculatedWeeks);
    }
  }, [tdee, formValues.currentWeight, formValues.targetWeight]);

  useEffect(() => {
    setFormValues({
      currentWeight,
      targetWeight: targetWeight || undefined,
      startDate: weightGoals?.startDate || todayString,
    });
  }, [currentWeight, targetWeight, weightGoals, todayString]);

  useEffect(() => {
    // Check if values have changed from props
    const isDifferent =
      formValues.currentWeight !== currentWeight ||
      formValues.targetWeight !== targetWeight ||
      calorieIntake !== weightGoals?.adjustedCalorieIntake;

    setHasChanges(isDifferent);
  }, [formValues, currentWeight, targetWeight, calorieIntake, weightGoals]);

  // Update calculations when calorie intake changes
  const handleCalorieIntakeChange = (value: number | undefined) => {
    setCalorieIntake(value);

    if (value && tdee && formValues.currentWeight && formValues.targetWeight) {
      // Generate new calculations based on the adjusted calorie intake
      const calculations = generateWeightGoalCalculations(
        tdee,
        formValues.currentWeight,
        formValues.targetWeight,
        value
      );

      // Update all calculation-dependent state values
      setCalculatedTargetDate(calculations.targetDate);
      setWeeklyWeightChange(calculations.weeklyChange);
      setCalculatedWeeks(calculations.calculatedWeeks);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (!formValues.targetWeight) return;

    // Create a complete goal object with all the calculated values
    const completeGoal = {
      ...formValues,
      adjustedCalorieIntake: calorieIntake,
      startDate: formValues.startDate || todayString,
      targetDate: calculatedTargetDate,
      weeklyChange: weeklyWeightChange,
      calculatedWeeks: calculatedWeeks,
      weightGoal:
        formValues.currentWeight > formValues.targetWeight
          ? "lose"
          : formValues.currentWeight < formValues.targetWeight
          ? "gain"
          : "maintain",
    };

    onSave(completeGoal);
    setIsEditing(false);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Calculate progress percentage
  const weightDifference = Math.abs(targetWeight - currentWeight);
  const initialDifference = Math.abs(
    targetWeight - (weightGoals?.currentWeight || currentWeight)
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
  const isWeightLoss =
    formValues.currentWeight > (formValues.targetWeight || 0);
  const isWeightGain =
    formValues.currentWeight < (formValues.targetWeight || 0);
  const isMaintenance =
    formValues.currentWeight === formValues.targetWeight &&
    formValues.targetWeight !== undefined;

  // Calculate target calories
  const targetCalories = weightGoals?.adjustedCalorieIntake || tdee;

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

  if (isEditing) {
    return (
      <div
        className={`bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden ${className}`}
      >
        <div className="p-6">
          <div className="flex items-center mb-5">
            <div className="p-2 rounded-lg bg-indigo-600/20 mr-3">
              <GoalsIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-200">
              {!weightGoals ? "Set Your Weight Goal" : "Edit Weight Goal"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <NumberField
              label="Current Weight (kg)"
              value={formValues.currentWeight}
              onChange={(value) =>
                setFormValues({ ...formValues, currentWeight: value || 0 })
              }
              min={30}
              max={300}
              step={0.1}
              required
              helperText="Your current weight in kilograms"
            />

            <NumberField
              label="Target Weight (kg)"
              value={formValues.targetWeight}
              onChange={(value) =>
                setFormValues({ ...formValues, targetWeight: value })
              }
              min={30}
              max={300}
              step={0.1}
              required
              helperText="Your goal weight in kilograms"
            />
          </div>

          {tdee && calorieIntake !== undefined && formValues.targetWeight && (
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-200">
                  Daily Calorie Intake
                </label>
                <span className="text-sm text-gray-400">
                  {calorieIntake} calories/day
                </span>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min={
                    isWeightLoss
                      ? Math.max(tdee - 1000, 1200)
                      : isMaintenance
                      ? tdee - 300
                      : tdee
                  }
                  max={
                    isWeightLoss
                      ? tdee
                      : isMaintenance
                      ? tdee + 300
                      : tdee + 1000
                  }
                  step={50}
                  value={calorieIntake}
                  onChange={(e) =>
                    handleCalorieIntakeChange(Number(e.target.value))
                  }
                  className="appearance-none w-full h-2 bg-gray-700 rounded-lg outline-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  {isWeightLoss ? (
                    <>
                      <span>Faster</span>
                      <span>TDEE ({tdee})</span>
                      <span>Slower</span>
                    </>
                  ) : isMaintenance ? (
                    <>
                      <span>Less calories</span>
                      <span>TDEE ({tdee})</span>
                      <span>More calories</span>
                    </>
                  ) : (
                    <>
                      <span>Slower</span>
                      <span>TDEE ({tdee})</span>
                      <span>Faster</span>
                    </>
                  )}
                </div>
              </div>

              {!isMaintenance && (
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">
                      Estimated completion:{" "}
                      {calculatedTargetDate
                        ? new Date(calculatedTargetDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "Calculating..."}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Expected change:{" "}
                    {weeklyWeightChange !== undefined
                      ? `${Math.abs(weeklyWeightChange).toFixed(2)} kg per week`
                      : "Calculating..."}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Estimated duration:{" "}
                    {calculatedWeeks !== undefined
                      ? `${calculatedWeeks} weeks`
                      : "Calculating..."}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-600/30">
                    <p className="text-xs text-gray-400 flex justify-between">
                      <span>
                        {isWeightLoss
                          ? `Deficit: ${Math.abs(tdee - calorieIntake)} kcal`
                          : `Surplus: ${Math.abs(tdee - calorieIntake)} kcal`}
                      </span>
                      <span
                        className={
                          (isWeightLoss &&
                            Math.abs(tdee - calorieIntake) > 800) ||
                          (!isWeightLoss &&
                            Math.abs(tdee - calorieIntake) > 800)
                            ? "text-orange-400"
                            : "text-green-400"
                        }
                      >
                        {(isWeightLoss &&
                          Math.abs(tdee - calorieIntake) > 800) ||
                        (!isWeightLoss && Math.abs(tdee - calorieIntake) > 800)
                          ? "Large adjustment"
                          : "Healthy range"}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {isMaintenance && (
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Maintenance Goal</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    You're aiming to maintain your current weight with{" "}
                    {calorieIntake < tdee
                      ? "slightly fewer"
                      : calorieIntake > tdee
                      ? "slightly more"
                      : "the same"}{" "}
                    calories than your TDEE
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            {weightGoals && (
              <FormButton
                type="button"
                variant="secondary"
                onClick={toggleEdit}
              >
                Cancel
              </FormButton>
            )}
            <FormButton
              type="button"
              variant="primary"
              disabled={!hasChanges || isLoading || !formValues.targetWeight}
              isLoading={isLoading}
              onClick={handleSave}
            >
              {!weightGoals ? "Calculate Goal" : "Update Goal"}
            </FormButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden ${className}`}
    >
      <div className="p-6">
        {/* Header with goal type and edit button */}
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
          <button
            onClick={toggleEdit}
            className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-700 transition-colors"
            aria-label="Edit weight goal"
          >
            <EditIcon className="text-gray-300" />
          </button>
        </div>

        {/* Goal progress visual */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
            <div className="flex items-baseline space-x-3 mb-2 md:mb-0">
              <span className="text-2xl font-bold text-gray-200">
                {currentWeight} kg
              </span>
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              <span className="text-xl text-gray-400">{targetWeight} kg</span>
              {!isMaintenance && (
                <span className={`text-${goalColor}-400 ml-1 text-sm`}>
                  ({isWeightLoss ? "-" : "+"}
                  {Math.abs(targetWeight - currentWeight).toFixed(1)} kg)
                </span>
              )}
            </div>
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
          </div>

          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full rounded-full bg-${goalColor}-500`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Start: {weightGoals?.currentWeight || currentWeight} kg</span>
            <span>Target: {targetWeight} kg</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Weekly Rate */}
          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Weekly Rate</p>
            <p className="text-lg font-medium text-gray-200">
              {isMaintenance
                ? "Maintain weight"
                : `${isWeightLoss ? "-" : "+"}${Math.abs(
                    weeklyWeightChange || 0
                  ).toFixed(2)} kg/week`}
            </p>
          </div>

          {/* Time Remaining */}
          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Time Remaining</p>
            <p className="text-lg font-medium text-gray-200">
              {isMaintenance ? "Ongoing" : `${calculatedWeeks || 0} weeks`}
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
                : `${Math.abs(
                    tdee - (weightGoals?.adjustedCalorieIntake || tdee)
                  )} kcal`}
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
                  {Math.round(targetCalories)}
                </span>
              </div>
            </div>
            <ProgressBar
              progress={Math.min(
                Math.round((macroDailyTotals.calories / targetCalories) * 100),
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
              target={Math.round(currentWeight * 2)}
              color="green"
            />

            {/* Carbs */}
            <MacroNutrient
              label="Carbs"
              current={macroDailyTotals.carbs}
              target={Math.round((targetCalories * 0.5) / 4)}
              color="blue"
            />

            {/* Fats */}
            <MacroNutrient
              label="Fats"
              current={macroDailyTotals.fats}
              target={Math.round((targetCalories * 0.25) / 9)}
              color="red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for macro tracking with a more compact design
function MacroNutrient({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: "red" | "blue" | "green";
}) {
  const progress = Math.min(Math.round((current / target) * 100), 100);
  const colorClasses = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
  };

  return (
    <div className="bg-gray-700/30 rounded-lg p-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${colorClasses[color]}`}
          ></span>
          <span className="text-xs text-gray-300">{label}</span>
        </div>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-sm font-semibold text-gray-200">
          {Math.round(current)}g
        </span>
        <span className="text-xs text-gray-500">/ {target}g</span>
      </div>
      <ProgressBar progress={progress} color={color} height="sm" />
    </div>
  );
}

export default WeightGoalDashboard;
