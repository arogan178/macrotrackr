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
import {
  computeDailyDifferenceForDisplay,
  computeEffectiveTargetCalories,
} from "@/features/goals/utils/calorie";
import { calculateGoalProgress } from "@/features/goals/utils/goalUtilities";
import { formatDate } from "@/features/reporting/utils/dateUtilities";
import type { WeightGoals } from "@/types/goal";
import type { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";

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
    targetCalories || computeEffectiveTargetCalories(tdee, weightGoals);

  const goalTypeLabel = isWeightLoss
    ? "Weight Loss"
    : isWeightGain
      ? "Weight Gain"
      : "Maintenance";

  // Normalize goal colors to your tokenized palette so bg classes exist in Tailwind output
  // Map to token names used across the design system
  const goalToken = isWeightLoss
    ? "vibrant-accent"
    : isWeightGain
      ? "success"
      : "carbs";
  const goalTextColor = `text-${goalToken}`;
  const goalBgColorLight = `bg-${goalToken}/10`;
  const goalBorderColor = `border-${goalToken}`;

  const formattedStartDate = formatDate(weightGoals?.startDate ?? "");
  const formattedTargetDate = formatDate(weightGoals?.targetDate ?? "");

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

  // Mirror existing display behavior via shared helper
  const dailyDifference = computeDailyDifferenceForDisplay(
    tdee,
    weightGoals,
    true,
    50,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border/50 bg-surface p-4 shadow-primary sm:p-6"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center">
          <div className={`rounded-lg p-2.5 ${goalBgColorLight} mr-3`}>
            <WeightIcon className={`h-6 w-6 ${goalTextColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {goalTypeLabel} Plan
            </h2>
            <p className="text-sm text-muted">
              {formattedStartDate} → {formattedTargetDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="primary"
            onClick={onLogWeight}
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
        <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-foreground">
              <AnimatedNumber
                value={startingWeight}
                toFixedValue={1}
                suffix=" kg"
              />
            </span>
            {!isMaintenance && (
              <>
                <ChevronRightIcon />
                <span className="text-xl text-foreground">
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
              <span className="text-lg text-foreground">
                Maintaining Weight
              </span>
            )}
          </div>
          {!isMaintenance && (
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-sm text-foreground">Progress:</span>
              <span className="text-lg font-semibold text-foreground">
                {progressPercentage}%
              </span>
            </div>
          )}
        </div>

        {!isMaintenance && (
          <>
            <ProgressBar
              progress={progressPercentage}
              color={
                isWeightLoss
                  ? ("accent" as any)
                  : isWeightGain
                    ? ("green" as any)
                    : ("blue" as any)
              }
              height="md"
              className="mb-1"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>
                Start:
                <AnimatedNumber
                  value={goalStartingWeight}
                  toFixedValue={1}
                  suffix=" kg"
                />
              </span>
              <span>
                Target:
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
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg border p-3 ${goalBorderColor}`}
        >
          <TrendingUpIcon
            className={`h-5 w-5 ${goalTextColor} mt-0.5 shrink-0`}
          />
          <div>
            <p className=" text-foreground">Weekly Rate</p>
            <p className="text-base font-medium text-foreground">
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
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg border p-3 ${goalBorderColor}`}
        >
          <CalendarIcon
            className={`h-5 w-5 ${goalTextColor} mt-0.5 shrink-0`}
          />
          <div>
            <p className=" text-foreground">Est. Duration</p>
            <p className="text-base text-sm font-medium text-foreground">
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
          className={`flex items-start gap-3 ${goalBgColorLight} rounded-lg border p-3 ${goalBorderColor}`}
        >
          <TargetIcon className={`h-5 w-5 ${goalTextColor} mt-0.5 shrink-0`} />
          <div>
            <p className="text-foreground">
              {isWeightLoss
                ? "Daily Deficit"
                : isWeightGain
                  ? "Daily Surplus"
                  : "Est. TDEE"}
            </p>
            <p className="text-base text-sm font-medium text-foreground">
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
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Daily Nutrition Target
        </h3>
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalorieIcon className="h-4 w-4 text-vibrant-accent" />
              <span className="text-sm font-medium text-foreground">
                Calories
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-foreground">
                <AnimatedNumber value={Math.round(macroDailyTotals.calories)} />
              </span>
              <span className="mx-1 text-foreground">/</span>
              <span className="text-foreground">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
