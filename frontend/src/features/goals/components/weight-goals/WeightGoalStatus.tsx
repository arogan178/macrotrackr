// src/features/goals/components/WeightGoalStatus.tsx

import { memo, type ReactNode } from "react";
import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import {
  Button,
  IconButtonGroup,
  WeightIcon,
} from "@/components/ui";
import {
  computeDailyDifferenceForDisplay,
} from "@/features/goals/utils/calorie";
import {
  calculateGoalProgress,
  getGoalStatus,
} from "@/features/goals/utils/goalUtilities";
import type { WeightGoals } from "@/types/goal";
import type { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import { formatDateShort } from "@/utils/dateUtilities";
import {
  formatWeight,
  fromKg,
  type UnitSystem,
  weightUnit,
} from "@/utils/unitConversion";
import { maintenanceLabel } from "@/utils/userConstants";


interface WeightGoalStatusProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  tdeeIsOverride?: boolean;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | undefined | null;
  onEdit: () => void;
  onDelete: () => void;
  onLogWeight: () => void;
  targetCalories?: number;
  macroTarget?: MacroTargetSettings;
  unitSystem?: UnitSystem;
  /** Latest trend weight in kg. */
  trendWeight?: number;
  /** Trend change over the last 7 days in kg. */
  trendChange?: number;
}

const PACE: Record<ReturnType<typeof getGoalStatus>, { label: string; className: string }> = {
  ahead: { label: "Ahead", className: "bg-primary/12 text-primary" },
  "on-track": { label: "On pace", className: "bg-primary/12 text-primary" },
  behind: { label: "Behind", className: "bg-warning/12 text-warning" },
  completed: { label: "Reached", className: "bg-primary/12 text-primary" },
};

function PacePill({ pace }: { pace: ReturnType<typeof getGoalStatus> }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PACE[pace].className}`}>
      {PACE[pace].label}
    </span>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-3 py-3 first:pl-0 md:px-6 md:first:pl-6">
      <dt className="truncate text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold whitespace-nowrap text-foreground">
        {children}
      </dd>
    </div>
  );
}

const WeightGoalStatus = memo(function WeightGoalStatus({
  startingWeight,
  targetWeight,
  tdee,
  tdeeIsOverride = false,
  weightGoals,
  onEdit,
  onDelete,
  onLogWeight,
  unitSystem = "metric",
  trendWeight,
  trendChange,
}: WeightGoalStatusProps) {
  const unit = weightUnit(unitSystem);
  const goalStartingWeight = weightGoals?.startingWeight ?? startingWeight;
  const progressPercentage = weightGoals
    ? calculateGoalProgress(weightGoals).progress
    : 0;

  const weightGoal = weightGoals?.weightGoal ?? "maintain";
  const isWeightLoss = weightGoal === "lose";
  const isWeightGain = weightGoal === "gain";
  const isMaintenance = weightGoal === "maintain";


  const goalTypeLabel = isWeightLoss
    ? "Weight loss"
    : isWeightGain
      ? "Weight gain"
      : "Maintenance";

  // Normalize goal colors to your tokenized palette so bg classes exist in Tailwind output
  // Map to token names used across the design system
  const goalStyles = isWeightLoss
    ? {
        text: "text-primary",
        bgLight: "bg-primary/10",
      }
    : isWeightGain
      ? {
          text: "text-success",
          bgLight: "bg-success/10",
        }
      : {
          text: "text-carbs",
          bgLight: "bg-carbs/10",
        };
  const goalTextColor = goalStyles.text;
  const goalBgColorLight = goalStyles.bgLight;

  const formattedStartDate = formatDateShort(weightGoals?.startDate ?? "");
  const formattedTargetDate = formatDateShort(weightGoals?.targetDate ?? "");


  let trendChangeText: string | undefined;
  if (trendChange !== undefined) {
    trendChangeText =
      Math.abs(fromKg(trendChange, unitSystem)) < 0.05
        ? "Steady over 7 days"
        : `${trendChange < 0 ? "Down" : "Up"} ${formatWeight(Math.abs(trendChange), unitSystem)} in 7 days`;
  }

  const weeklyChange = weightGoals?.weeklyChange ?? 0;
  const calculatedWeeks = weightGoals?.calculatedWeeks ?? 0;

  // Mirror existing display behavior via shared helper
  const dailyDifference = computeDailyDifferenceForDisplay(
    tdee,
    weightGoals ?? undefined,
    true,
    50,
  );

  const pace = weightGoals ? getGoalStatus(weightGoals) : undefined;
  const remainingWeight = Math.abs(targetWeight - startingWeight);
  // Where the current and trend weights sit on the start-to-target line.
  const journeySpan = targetWeight - goalStartingWeight;
  const along = (weight: number) =>
    journeySpan === 0
      ? 0
      : Math.min(100, Math.max(0, ((weight - goalStartingWeight) / journeySpan) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-card border border-border bg-surface max-md:rounded-none max-md:border-0 max-md:bg-transparent md:flex md:h-full md:flex-col md:overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 md:p-6 md:pb-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`shrink-0 rounded-control p-2 ${goalBgColorLight}`}>
            <WeightIcon className={`h-5 w-5 ${goalTextColor}`} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
              {goalTypeLabel} plan
            </h2>
            <p className="text-xs whitespace-nowrap text-muted">
              {formattedStartDate} to {formattedTargetDate}
            </p>
          </div>
        </div>
        <IconButtonGroup
          onEdit={onEdit}
          onDelete={onDelete}
          editLabel="Edit weight goal"
          deleteLabel="Delete weight goal"
          isDeleting={false}
        />
      </div>

      {/* The plan as one line: start on the left, target on the right, you on
          it. How far the dot has travelled is the progress; the pill says
          whether that is where the calendar expects you to be. */}
      <div className="mt-6 md:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex items-baseline gap-2">
            <span className="font-stretch-condensed text-4xl font-semibold tracking-tight text-foreground tabular-nums">
              <AnimatedNumber
                value={fromKg(startingWeight, unitSystem)}
                toFixedValue={1}
              />
            </span>
            <span className="text-sm text-muted">{unit}</span>
          </span>
          {pace && !isMaintenance && <PacePill pace={pace} />}
        </div>

        {!isMaintenance && (
          <>
            <div className="relative mt-4 h-2" aria-hidden>
              <div className="absolute inset-0 overflow-hidden rounded-full bg-foreground/8">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {trendWeight !== undefined && (
                <div
                  className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-muted"
                  style={{ left: `${along(trendWeight)}%` }}
                />
              )}
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
                style={{ left: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted tabular-nums">
              <span>{formatWeight(goalStartingWeight, unitSystem)}</span>
              <span>{formatWeight(targetWeight, unitSystem)}</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              <span className="text-foreground">
                {formatWeight(remainingWeight, unitSystem)}
              </span>{" "}
              to go, {progressPercentage}% of the way
            </p>
          </>
        )}

        {trendWeight !== undefined && (
          <p className="mt-1 flex flex-wrap justify-between gap-x-3 text-xs text-muted">
            <span>
              Trend weight{" "}
              <span className="text-foreground">{formatWeight(trendWeight, unitSystem)}</span>
            </span>
            {trendChangeText && <span>{trendChangeText}</span>}
          </p>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border md:mt-6">
        <Stat label="Weekly rate">
          {isMaintenance ? (
            "Maintain"
          ) : (
            <>
              {isWeightLoss ? "↓ " : "↑ "}
              <AnimatedNumber
                value={fromKg(Math.abs(weeklyChange), unitSystem)}
                toFixedValue={2}
                suffix={` ${unit}/wk`}
              />
            </>
          )}
        </Stat>
        <Stat label="Duration">
          {isMaintenance ? "Ongoing" : <AnimatedNumber value={calculatedWeeks} suffix=" wks" />}
        </Stat>
        <Stat
          label={
            isWeightLoss
              ? "Daily deficit"
              : isWeightGain
                ? "Daily surplus"
                : tdeeIsOverride
                  ? maintenanceLabel(true)
                  : "Est. TDEE"
          }
        >
          <AnimatedNumber
            value={isMaintenance ? tdee : dailyDifference}
            suffix=" kcal"
          />
        </Stat>
      </dl>

      {/* Pinned to the foot, so it lines up with the panel beside it. */}
      <div className="mt-6 md:mt-auto md:px-6 md:pt-6 md:pb-6">
        <Button
          variant="primary"
          onClick={onLogWeight}
          text="Log weight"
          leftIcon={<WeightIcon className="h-4 w-4" />}
          ariaLabel="Log current weight"
          className="w-full justify-center"
        />
      </div>
    </motion.div>
  );
});

export default WeightGoalStatus;
