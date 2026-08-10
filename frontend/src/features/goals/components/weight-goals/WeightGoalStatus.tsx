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
  const goalStyles = isWeightLoss
    ? {
        text: "text-vibrant-accent",
        bgLight: "bg-vibrant-accent/10",
        border: "border-vibrant-accent/30",
      }
    : isWeightGain
      ? {
          text: "text-success",
          bgLight: "bg-success/10",
          border: "border-success/30",
        }
      : {
          text: "text-carbs",
          bgLight: "bg-carbs/10",
          border: "border-carbs/30",
        };
  const goalTextColor = goalStyles.text;
  const goalBgColorLight = goalStyles.bgLight;
  const goalBorderColor = goalStyles.border;

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
      className="rounded-2xl border border-border/40 bg-surface p-3.5 sm:p-6"
    >
      {/* Header */}
      <div className="mb-3.5 sm:mb-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`rounded-xl p-2 sm:p-3 ${goalBgColorLight} shrink-0`}>
              <WeightIcon className={`h-5 w-5 sm:h-7 sm:w-7 ${goalTextColor}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-foreground/90 whitespace-nowrap">
                {goalTypeLabel} Plan
              </h2>
              <p className="text-xs sm:text-sm text-muted whitespace-nowrap">
                {formattedStartDate} → {formattedTargetDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:hidden shrink-0">
            <IconButtonGroup
              onEdit={onEdit}
              onDelete={onDelete}
              editLabel="Edit weight goal"
              deleteLabel="Delete weight goal"
              isDeleting={false}
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <Button
            variant="primary"
            onClick={onLogWeight}
            text="Log Weight"
            leftIcon={<WeightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            ariaLabel="Log current weight"
            buttonSize="sm"
            className="w-full sm:w-auto text-xs sm:text-sm px-3 py-1.5 justify-center"
          />
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <IconButtonGroup
              onEdit={onEdit}
              onDelete={onDelete}
              editLabel="Edit weight goal"
              deleteLabel="Delete weight goal"
              isDeleting={false}
            />
          </div>
        </div>
      </div>

      {/* Goal Progress Visual */}
      <CardContainer className="mb-3.5 sm:mb-6 border-border/60 bg-surface-2 p-3 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline space-x-1.5 min-w-0">
            <span className="text-lg sm:text-2xl font-bold text-foreground">
              <AnimatedNumber
                value={startingWeight}
                toFixedValue={1}
                suffix=" kg"
              />
            </span>
            {!isMaintenance && (
              <>
                <ChevronRightIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5 shrink-0 text-muted" />
                <span className="text-lg sm:text-2xl font-bold text-foreground">
                  <AnimatedNumber
                    value={targetWeight}
                    toFixedValue={1}
                    suffix=" kg"
                  />
                </span>
              </>
            )}
            {isMaintenance && (
              <span className="text-sm sm:text-lg text-foreground font-medium">
                Maintaining Weight
              </span>
            )}
          </div>
          {!isMaintenance && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs sm:text-sm text-muted hidden xs:inline">Progress:</span>
              <span className="text-base sm:text-lg font-semibold text-foreground">
                {progressPercentage}%
              </span>
            </div>
          )}
        </div>

        {!isMaintenance && (
          <>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className={`${goalTextColor} font-medium`}>
                {isWeightLoss ? "↓ " : "↑ "}
                <AnimatedNumber
                  value={Math.abs(targetWeight - goalStartingWeight)}
                  toFixedValue={1}
                  suffix=" kg goal"
                />
              </span>
            </div>
            <ProgressBar
              progress={progressPercentage}
              color={isWeightLoss ? "accent" : isWeightGain ? "green" : "blue"}
              height="md"
              className="mb-1"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
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
      </CardContainer>

      {/* Stats Grid */}
      <div className="mb-3.5 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-4">
        <CardContainer
          variant="interactive"
          className={`flex flex-col sm:flex-row items-start gap-1 sm:gap-4 p-2.5 sm:p-5 border ${goalBorderColor} ${goalBgColorLight}`}
        >
          <TrendingUpIcon
            className={`${goalTextColor} h-4 w-4 sm:h-6 sm:w-6 shrink-0`}
          />
          <div className="min-w-0">
            <p className="text-[11px] sm:text-sm font-medium text-muted truncate">Weekly Rate</p>
            <p className="text-xs sm:text-lg font-bold tracking-tight text-foreground/90 whitespace-nowrap">
              {isMaintenance ? "Maintain" : `${isWeightLoss ? "↓" : "↑"} `}
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
          variant="interactive"
          className={`flex flex-col sm:flex-row items-start gap-1 sm:gap-4 p-2.5 sm:p-5 border ${goalBorderColor} ${goalBgColorLight}`}
        >
          <CalendarIcon
            className={`${goalTextColor} h-4 w-4 sm:h-6 sm:w-6 shrink-0`}
          />
          <div className="min-w-0">
            <p className="text-[11px] sm:text-sm font-medium text-muted truncate">Est. Duration</p>
            <p className="text-xs sm:text-lg font-bold tracking-tight text-foreground/90 whitespace-nowrap">
              {isMaintenance ? (
                "Ongoing"
              ) : (
                <AnimatedNumber value={calculatedWeeks} suffix=" wks" />
              )}
            </p>
          </div>
        </CardContainer>
        <CardContainer
          variant="interactive"
          className={`flex flex-col sm:flex-row items-start gap-1 sm:gap-4 p-2.5 sm:p-5 border ${goalBorderColor} ${goalBgColorLight}`}
        >
          <TargetIcon className={`${goalTextColor} h-4 w-4 sm:h-6 sm:w-6 shrink-0`} />
          <div className="min-w-0">
            <p className="text-[11px] sm:text-sm font-medium text-muted truncate">
              {isWeightLoss
                ? "Daily Deficit"
                : isWeightGain
                  ? "Daily Surplus"
                  : "Est. TDEE"}
            </p>
            <p className="text-xs sm:text-lg font-bold tracking-tight text-foreground/90 whitespace-nowrap">
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
      <CardContainer className="border-border/60 bg-surface-2 p-3 sm:p-5">
        <h3 className="mb-2.5 sm:mb-4 text-base sm:text-lg font-semibold tracking-tight text-foreground/90">
          Daily Nutrition Target
        </h3>
        <div className="mb-2 sm:mb-3 rounded-xl border border-border/40 bg-surface p-2.5 sm:p-3.5">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalorieIcon className="h-4 w-4 text-vibrant-accent shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                Calories
              </span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-foreground">
              <span>
                <AnimatedNumber value={Math.round(macroDailyTotals.calories)} />
              </span>
              <span className="mx-1 text-muted">/</span>
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
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
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
