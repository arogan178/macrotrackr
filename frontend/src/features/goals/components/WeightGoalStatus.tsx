// src/features/goals/components/WeightGoalStatus.tsx

import { motion } from "motion/react";
import { memo } from "react";

import { AnimatedNumber } from "@/components/animation/";
import {
  Button,
  CalendarIcon,
  CalorieIcon,
  ChevronRightIcon,
  IconButtonGroup,
  ProgressBar,
  TargetIcon,
  TrendingUpIcon,
  WeightIcon,
} from "@/components/ui";
import type { WeightGoals } from "@/types/goal";
import type { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import { formatDate } from "@/features/reporting/utils/dateUtilities";
import { calculateGoalProgress } from "@/features/goals/utils/goalUtilities";

import MacroNutrient from "./MacroNutrient";

interface WeightGoalStatusProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onLogWeight: () => void;
  targetCalories?: number;
  macroTarget?: MacroTargetSettings;
}

const WeightGoalStatus = memo(function WeightGoalStatus({
  startingWeight,
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
  const goalStartingWeight = weightGoals?.startingWeight ?? startingWeight;
  const progressPercentage = weightGoals
    ? calculateGoalProgress(weightGoals).progress
    : 0;

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
  const goalBgColorLight = `bg-${goalColor}-600/10`;
  const goalBorderColor = `border-${goalColor}-500`;

  const formattedStartDate = formatDate(weightGoals?.startDate ?? "");
  const formattedTargetDate = formatDate(weightGoals?.targetDate ?? "", {
    year: "numeric",
  });

  const targetPercentages = macroTarget || {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  };

  const targetProteinGrams = Math.round(
    (effectiveCalorieTarget * targetPercentages.proteinPercentage) / 100 / 4,
  );
  const targetCarbsGrams = Math.round(
    (effectiveCalorieTarget * targetPercentages.carbsPercentage) / 100 / 4,
  );
  const targetFatsGrams = Math.round(
    (effectiveCalorieTarget * targetPercentages.fatsPercentage) / 100 / 9,
  );

  const weeklyChange = weightGoals?.weeklyChange || 0;
  const calculatedWeeks = weightGoals?.calculatedWeeks || 0;
  let dailyDifference = Math.abs(weightGoals?.dailyChange || 0);
  if (dailyDifference === 0 && weightGoals?.calorieTarget && tdee > 0) {
    dailyDifference = Math.abs(tdee - weightGoals.calorieTarget);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 bg-background/50 rounded-xl border border-border/50 shadow-primary"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <div className={`p-2.5 rounded-lg ${goalBgColorLight} mr-3`}>
            <WeightIcon className={`w-6 h-6 ${goalTextColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-muted">
              {goalTypeLabel} Plan
            </h2>
            <p className="text-sm text-muted">
              {formattedStartDate} → {formattedTargetDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="secondary"
            onClick={onLogWeight}
            className="bg-surface/20 hover:bg-surface/30 text-foreground font-medium transition-colors duration-200 focus:ring-primary"
            text="Log Weight"
            icon={<WeightIcon />}
            iconPosition="left"
            ariaLabel="Log current weight"
          />
          <IconButtonGroup
            onEdit={onEdit}
            onDelete={onDelete}
            editLabel="Edit weight goal"
            deleteLabel="Delete weight goal"
            isDeleting={false}
          />
        </div>
      </div>

      {/* Goal Progress Visual */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-muted">
              <AnimatedNumber
                value={startingWeight}
                toFixedValue={1}
                suffix=" kg"
              />
            </span>
            {!isMaintenance && (
              <>
                <ChevronRightIcon className="w-4 h-4 text-muted shrink-0" />{" "}
                <span className="text-xl text-muted">
                  <AnimatedNumber
                    value={targetWeight}
                    toFixedValue={1}
                    suffix=" kg"
                  />
                </span>
                <span className={`${goalTextColor} ml-1 text-sm font-medium`}>
                  ({isWeightLoss ? "↓" : "↑"}
                  <AnimatedNumber
                    value={Math.abs(targetWeight - goalStartingWeight)}
                    toFixedValue={1}
                    suffix=" kg goal)"
                  />
                </span>
              </>
            )}
            {isMaintenance && (
              <span className="text-lg text-muted">Maintaining Weight</span>
            )}
          </div>
          {!isMaintenance && (
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-sm text-muted">Progress:</span>
              <span className="text-lg font-semibold text-muted">
                {progressPercentage}%
              </span>
            </div>
          )}
        </div>

        {!isMaintenance && (
          <>
            <ProgressBar
              progress={progressPercentage}
              color={goalColor as any}
              height="md"
              className="mb-1"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>
                Start:{" "}
                <AnimatedNumber
                  value={goalStartingWeight}
                  toFixedValue={1}
                  suffix=" kg"
                />
              </span>
              <span>
                Target:{" "}
                <AnimatedNumber
                  value={targetWeight}
                  toFixedValue={1}
                  suffix=" kg"
                />
              </span>
            </div>
          </>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg p-3 border ${goalBorderColor}/30`}
        >
          <TrendingUpIcon
            className={`w-5 h-5 ${goalTextColor} mt-0.5 shrink-0`}
          />
          <div>
            <p className="text-xs text-muted mb-0.5">Weekly Rate</p>{" "}
            <p className="text-base font-medium text-muted">
              {isMaintenance ? "Maintenance" : `${isWeightLoss ? "↓" : "↑"} `}
              {!isMaintenance && (
                <AnimatedNumber
                  value={Math.abs(weeklyChange)}
                  toFixedValue={2}
                  suffix=" kg/week"
                />
              )}
            </p>
          </div>
        </div>
        <div
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg p-3 border ${goalBorderColor}/30`}
        >
          <CalendarIcon
            className={`w-5 h-5 ${goalTextColor} mt-0.5 shrink-0`}
          />
          <div>
            <p className="text-xs text-muted mb-0.5">Est. Duration</p>{" "}
            <p className="text-base font-medium text-muted">
              {isMaintenance ? (
                "Ongoing"
              ) : (
                <>
                  <AnimatedNumber value={calculatedWeeks} suffix=" weeks" />
                </>
              )}
            </p>
          </div>
        </div>
        <div
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg p-3 border ${goalBorderColor}/30`}
        >
          <TargetIcon className={`w-5 h-5 ${goalTextColor} mt-0.5 shrink-0`} />
          <div>
            <p className="text-xs text-muted mb-0.5">
              {isWeightLoss
                ? "Daily Deficit"
                : isWeightGain
                  ? "Daily Surplus"
                  : "Est. TDEE"}
            </p>{" "}
            <p className="text-base font-medium text-muted">
              {isMaintenance ? (
                <AnimatedNumber value={tdee} suffix=" kcal" />
              ) : (
                <AnimatedNumber value={dailyDifference} suffix=" kcal" />
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Nutrition section */}
      <div>
        <h3 className="font-semibold text-lg text-muted mb-4">
          Daily Nutrition Target
        </h3>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <CalorieIcon className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-muted">Calories</span>
            </div>{" "}
            <div className="text-sm">
              <span className="font-medium text-muted">
                <AnimatedNumber value={Math.round(macroDailyTotals.calories)} />
              </span>
              <span className="text-muted mx-1">/</span>
              <span className="text-muted">
                <AnimatedNumber
                  value={Math.round(effectiveCalorieTarget)}
                  suffix=" kcal"
                />
              </span>
            </div>
          </div>
          <ProgressBar
            progress={Math.min(
              100,
              effectiveCalorieTarget > 0
                ? Math.round(
                    (macroDailyTotals.calories / effectiveCalorieTarget) * 100,
                  )
                : 0,
            )}
            color={"accent"}
            height="sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MacroNutrient
            label="Protein"
            current={macroDailyTotals.protein}
            target={targetProteinGrams}
            color="protein"
          />
          <MacroNutrient
            label="Carbs"
            current={macroDailyTotals.carbs}
            target={targetCarbsGrams}
            color="carbs"
          />
          <MacroNutrient
            label="Fats"
            current={macroDailyTotals.fats}
            target={targetFatsGrams}
            color="fats"
          />
        </div>
      </div>
    </motion.div>
  );
});

export default WeightGoalStatus;
