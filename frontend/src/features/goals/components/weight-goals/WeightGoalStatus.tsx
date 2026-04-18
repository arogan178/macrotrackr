// src/features/goals/components/WeightGoalStatus.tsx

import { memo } from "react";
import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import CardContainer from "@/components/form/CardContainer";
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
import type { WeightGoals } from "@/types/goal";
import type { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import { formatDateShort } from "@/utils/dateUtilities";

import MacroNutrient from "../macros/MacroNutrient";

interface WeightGoalStatusProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | undefined | null;
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

  const weightGoal = weightGoals?.weightGoal ?? "maintain";
  const isWeightLoss = weightGoal === "lose";
  const isWeightGain = weightGoal === "gain";
  const isMaintenance = weightGoal === "maintain";

  const effectiveCalorieTarget =
    targetCalories ??
    computeEffectiveTargetCalories(tdee, weightGoals ?? undefined);

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

  const formattedStartDate = formatDateShort(weightGoals?.startDate ?? "");
  const formattedTargetDate = formatDateShort(weightGoals?.targetDate ?? "");

  const targetPercentages = macroTarget ?? {
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

  const weeklyChange = weightGoals?.weeklyChange ?? 0;
  const calculatedWeeks = weightGoals?.calculatedWeeks ?? 0;

  // Mirror existing display behavior via shared helper
  const dailyDifference = computeDailyDifferenceForDisplay(
    tdee,
    weightGoals ?? undefined,
    true,
    50,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border/40 bg-surface p-6"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center">
          <div className={`rounded-xl p-3 ${goalBgColorLight} mr-4`}>
            <WeightIcon className={`h-7 w-7 ${goalTextColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground/90">
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
            leftIcon={<WeightIcon />}
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
      <CardContainer className="mb-8 border-border/60 bg-surface-2 p-5">
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
              <span className="text-sm text-muted">Progress:</span>
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
              color={isWeightLoss ? "accent" : isWeightGain ? "green" : "blue"}
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
      </CardContainer>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <CardContainer
          variant="transparent"
          className={`flex items-start gap-4 p-5 transition-[filter,transform] duration-200 hover:brightness-110 ${goalBgColorLight} ${goalBorderColor}`}
        >
          <TrendingUpIcon
            className={` ${goalTextColor} mt-0.5 h-6 w-6 shrink-0`}
          />
          <div>
            <p className="text-sm font-medium text-muted">Weekly Rate</p>
            <p className="text-lg font-bold tracking-tight text-foreground/90">
              {isMaintenance ? "Maintenance" : `${isWeightLoss ? "↓" : "↑"} `}
              {!isMaintenance && (
                <AnimatedNumber
                  value={Math.abs(weeklyChange)}
                  toFixedValue={2}
                  suffix=" kg/wk"
                />
              )}
            </p>
          </div>
        </CardContainer>
        <CardContainer
          variant="transparent"
          className={`flex items-start gap-4 p-5 transition-[filter,transform] duration-200 hover:brightness-110 ${goalBgColorLight} ${goalBorderColor}`}
        >
          <CalendarIcon
            className={` ${goalTextColor} mt-0.5 h-6 w-6 shrink-0`}
          />
          <div>
            <p className="text-sm font-medium text-muted">Est. Duration</p>
            <p className="text-lg font-bold tracking-tight text-foreground/90">
              {isMaintenance ? (
                "Ongoing"
              ) : (
                <AnimatedNumber value={calculatedWeeks} suffix=" wks" />
              )}
            </p>
          </div>
        </CardContainer>
        <CardContainer
          variant="transparent"
          className={`flex items-start gap-4 p-5 transition-[filter,transform] duration-200 hover:brightness-110 ${goalBgColorLight} ${goalBorderColor}`}
        >
          <TargetIcon className={` ${goalTextColor} mt-0.5 h-6 w-6 shrink-0`} />
          <div>
            <p className="text-sm font-medium text-muted">
              {isWeightLoss
                ? "Daily Deficit"
                : isWeightGain
                  ? "Daily Surplus"
                  : "Est. TDEE"}
            </p>
            <p className="text-lg font-bold tracking-tight text-foreground/90">
              {isMaintenance ? (
                <AnimatedNumber value={tdee} suffix=" kcal" />
              ) : (
                <AnimatedNumber value={dailyDifference} suffix=" kcal" />
              )}
            </p>
          </div>
        </CardContainer>
      </div>

      {/* Nutrition section */}
      <CardContainer className="border-border/60 bg-surface-2 p-5">
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground/90">
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
      </CardContainer>
    </motion.div>
  );
});

export default WeightGoalStatus;
