import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { useForm, useStore } from "@tanstack/react-form";

import WeightField from "@/components/form/WeightField";
import { RangeSlider } from "@/components/ui";
import { formatGrouped } from "@/lib/formatNumber";
import type { WeightGoals } from "@/types/goal";
import { todayISO } from "@/utils/dateUtilities";
import {
  generateWeightGoalCalculations,
  goalRatePercentFromWeeklyChange,
} from "@/utils/nutritionCalculations";
import {
  formatWeight,
  fromKg,
  type UnitSystem,
  weightLimits,
  weightUnit,
} from "@/utils/unitConversion";
import { maintenanceLabel } from "@/utils/userConstants";

import { GOAL_RATE_PERCENT, GOAL_RATE_STEP } from "../../constants";
import { WeightGoalFormValues } from "../../types";
import { formatRatePercent } from "../../utils/goalUtilities";

export interface WeightGoalFormHandle {
  save: () => void;
}

interface WeightGoalFormProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  tdeeIsOverride?: boolean;
  weightGoals: WeightGoals | undefined | null;
  isLoading?: boolean;
  onSave: (values: WeightGoalFormValues) => void;
  onCancel?: () => void;
  /** Callback to report whether the form can be saved */
  onCanSaveChange?: (canSave: boolean) => void;
  unitSystem?: UnitSystem;
}

type GoalType = "lose" | "maintain" | "gain";
type GoalDirection = keyof typeof GOAL_RATE_PERCENT;

const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 300;

// Weights are stored in kg; the messages speak the user's unit.
const validateWeight =
  (label: string, unitSystem: UnitSystem) =>
  ({ value }: { value: number | undefined }) => {
    const { min, max } = weightLimits(MIN_WEIGHT_KG, MAX_WEIGHT_KG, unitSystem);
    const unit = weightUnit(unitSystem);
    if (value === undefined) return `${label} is required`;
    if (value < MIN_WEIGHT_KG)
      return `${label} must be at least ${min} ${unit}`;
    if (value > MAX_WEIGHT_KG) return `${label} must be at most ${max} ${unit}`;

    return undefined;
  };

// Determine goal type from weights
const getGoalType = (
  startingWeight: number | undefined,
  targetWeight: number | undefined,
): GoalType => {
  if (!startingWeight || !targetWeight) return "maintain";
  if (startingWeight > targetWeight) return "lose";
  if (startingWeight < targetWeight) return "gain";

  return "maintain";
};

const overrideNote = (tdeeIsOverride: boolean) =>
  tdeeIsOverride ? ` (${maintenanceLabel(true)})` : "";

const describeGoalRate = (
  percent: number,
  weeklyChangeKg: number,
  dailyCalorieChange: number,
  tdee: number,
  tdeeIsOverride: boolean,
  unitSystem: UnitSystem,
) => {
  const weeklyAmount = Math.abs(weeklyChangeKg);
  const weight = formatWeight(
    weeklyAmount,
    unitSystem,
    fromKg(weeklyAmount, unitSystem) < 0.1 ? 2 : 1,
  );
  const direction = dailyCalorieChange < 0 ? "below" : "above";

  return `${formatRatePercent(percent)} a week is ${weight}, about ${formatGrouped(Math.abs(dailyCalorieChange))} kcal a day ${direction} your ${formatGrouped(tdee)} kcal maintenance${overrideNote(tdeeIsOverride)}.`;
};

const WeightGoalForm = forwardRef<WeightGoalFormHandle, WeightGoalFormProps>(
  function WeightGoalForm(
    {
      startingWeight,
      targetWeight,
      tdee,
      tdeeIsOverride = false,
      weightGoals,
      isLoading = false,
      onSave,
      onCanSaveChange,
      unitSystem = "metric",
    },
    reference,
  ) {
    const todayString = todayISO();
    const isEditing = Boolean(weightGoals);
    const storedGoal = weightGoals?.weightGoal;
    // The rate is read back from the stored kg/week against the current weight.
    const storedRatePercent =
      weightGoals && storedGoal && storedGoal !== "maintain"
        ? goalRatePercentFromWeeklyChange(
            storedGoal,
            weightGoals.weeklyChange,
            weightGoals.currentWeight,
          )
        : undefined;

    const form = useForm({
      defaultValues: {
        startingWeight: (weightGoals?.startingWeight ?? startingWeight) as
          | number
          | undefined,
        targetWeight: (weightGoals?.targetWeight ?? targetWeight) as
          | number
          | undefined,
        // Kept per direction, so crossing the starting weight starts the
        // other direction at its own default.
        rateByGoal: (storedGoal && storedRatePercent !== undefined
          ? { [storedGoal]: storedRatePercent }
          : {}) as Partial<Record<GoalDirection, number>>,
      },
      onSubmit: () => {
        if (!formValues.targetWeight || !goalPlan) return;

        onSave({
          ...(isEditing ? {} : { startingWeight: formValues.startingWeight! }),
          targetWeight: formValues.targetWeight,
          calorieTarget: goalPlan.calorieTarget,
          startDate: weightGoals?.startDate ?? todayString,
          targetDate: goalPlan.targetDate,
          weeklyChange: goalPlan.weeklyChange,
          calculatedWeeks: goalPlan.calculatedWeeks,
          dailyChange: goalPlan.dailyChange,
          weightGoal: goalType,
        });
      },
    });
    const formValues = useStore(form.store, (state) => state.values);
    const isFormValid = useStore(form.store, (state) => state.isValid);

    const goalType = getGoalType(
      formValues.startingWeight,
      formValues.targetWeight,
    );
    const isMaintenance = goalType === "maintain";
    const ratePercent =
      goalType === "maintain"
        ? 0
        : (formValues.rateByGoal[goalType] ??
          GOAL_RATE_PERCENT[goalType].default);
    const rateBaseWeight =
      weightGoals?.currentWeight ?? formValues.startingWeight;

    const calculations = useMemo(() => {
      if (!tdee || !formValues.startingWeight || !formValues.targetWeight)
        return undefined;

      return generateWeightGoalCalculations(
        tdee,
        formValues.startingWeight,
        formValues.targetWeight,
        ratePercent,
        rateBaseWeight,
      );
    }, [
      tdee,
      formValues.startingWeight,
      formValues.targetWeight,
      ratePercent,
      rateBaseWeight,
    ]);

    // A saved goal keeps its calorie target, custom or not, until the user
    // changes its rate or direction.
    const keepsStoredTarget =
      isEditing &&
      weightGoals != undefined &&
      goalType === storedGoal &&
      (isMaintenance || ratePercent === storedRatePercent);
    const goalPlan =
      calculations && keepsStoredTarget && weightGoals
        ? {
            ...calculations,
            calorieTarget: weightGoals.calorieTarget,
            weeklyChange: weightGoals.weeklyChange,
            dailyChange: weightGoals.dailyChange,
          }
        : calculations;

    const hasChanges =
      isEditing && weightGoals
        ? formValues.startingWeight !== weightGoals.startingWeight ||
          formValues.targetWeight !== weightGoals.targetWeight ||
          !keepsStoredTarget
        : formValues.startingWeight != undefined &&
          formValues.targetWeight != undefined &&
          formValues.startingWeight > 0 &&
          formValues.targetWeight > 0 &&
          goalPlan != undefined;

    const canSave =
      hasChanges &&
      !isLoading &&
      formValues.targetWeight != undefined &&
      isFormValid;

    // Expose save method to parent via ref
    useImperativeHandle(
      reference,
      () => ({
        save: () => void form.handleSubmit(),
      }),
      [form],
    );

    // Keyboard shortcut: Ctrl+Enter to save
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === "Enter" && canSave) {
          event.preventDefault();
          void form.handleSubmit();
        }
      },
      [canSave, form],
    );

    useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);

      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
      onCanSaveChange?.(canSave);
    }, [canSave, onCanSaveChange]);

    const rateRange = isMaintenance ? undefined : GOAL_RATE_PERCENT[goalType];
    const setRatePercent = (percent: number) => {
      if (goalType === "maintain") return;
      form.setFieldValue("rateByGoal", (previous) => ({
        ...previous,
        [goalType]: percent,
      }));
    };
    const showsStoredTarget =
      keepsStoredTarget &&
      calculations !== undefined &&
      weightGoals !== undefined &&
      weightGoals !== null &&
      weightGoals.calorieTarget !== calculations.calorieTarget;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <form.Field
            name="startingWeight"
            validators={{
              onChange: validateWeight("Starting weight", unitSystem),
            }}
          >
            {(field) => (
              <WeightField
                label="Starting Weight"
                value={field.state.value}
                onChange={field.handleChange}
                unitSystem={unitSystem}
                minKg={MIN_WEIGHT_KG}
                maxKg={MAX_WEIGHT_KG}
                required
                // Disable only if editing an existing goal (weightGoals is not undefined)
                disabled={Boolean(weightGoals)}
                error={field.state.meta.errors[0]}
              />
            )}
          </form.Field>

          <form.Field
            name="targetWeight"
            validators={{
              onChange: validateWeight("Target weight", unitSystem),
            }}
          >
            {(field) => (
              <WeightField
                label="Target Weight"
                value={field.state.value}
                onChange={field.handleChange}
                unitSystem={unitSystem}
                minKg={MIN_WEIGHT_KG}
                maxKg={MAX_WEIGHT_KG}
                required
                error={field.state.meta.errors[0]}
              />
            )}
          </form.Field>
        </div>
        {!tdee && (
          <div className="rounded-control border border-warning/30 bg-warning/10 p-4 text-warning">
            <p className="text-sm font-semibold">Profile Details Incomplete</p>
            <p className="mt-1 text-xs">
              Please complete your profile details (Date of Birth, Gender,
              Height, Weight, and Activity Level) in Settings to calculate your
              BMR and TDEE before setting a weight goal.
            </p>
          </div>
        )}

        {tdee && goalPlan && calculations && formValues.targetWeight && (
          <div className="space-y-3">
            {rateRange && (
              <>
                <div className="flex items-center justify-between">
                  <span
                    id="goal-rate-label"
                    className="text-sm font-medium text-foreground"
                  >
                    Weekly rate
                  </span>
                  <span className="text-sm text-muted">
                    {formatRatePercent(ratePercent)} of body weight a week
                  </span>
                </div>

                <RangeSlider
                  value={ratePercent}
                  onChange={setRatePercent}
                  min={rateRange.min}
                  max={rateRange.max}
                  step={GOAL_RATE_STEP}
                  band={{
                    min: rateRange.recommendedMin,
                    max: rateRange.recommendedMax,
                  }}
                  ariaLabelledBy="goal-rate-label"
                  unit="percent a week"
                />
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>{formatRatePercent(rateRange.min)}</span>
                  <span>
                    Recommended {formatRatePercent(rateRange.recommendedMin)} to{" "}
                    {formatRatePercent(rateRange.recommendedMax)}
                  </span>
                  <span>{formatRatePercent(rateRange.max)}</span>
                </div>

                <p className="text-sm text-foreground">
                  {describeGoalRate(
                    ratePercent,
                    calculations.weeklyChange,
                    calculations.dailyChange,
                    tdee,
                    tdeeIsOverride,
                    unitSystem,
                  )}
                </p>
              </>
            )}

            <div className="rounded-control bg-surface p-3">
              <p className="text-sm text-foreground">
                <span className="font-medium">
                  Daily calorie target: {formatGrouped(goalPlan.calorieTarget)}{" "}
                  kcal
                </span>
              </p>
              {showsStoredTarget && (
                <p className="mt-1 text-xs text-muted">
                  Your saved target stays until you change the rate.
                </p>
              )}
              {isMaintenance ? (
                <p className="mt-1 text-xs text-muted">
                  Maintenance goal. Your maintenance is {formatGrouped(tdee)}{" "}
                  kcal a day{overrideNote(tdeeIsOverride)}.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-muted">
                    Estimated completion:{" "}
                    {new Date(goalPlan.targetDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Estimated duration: {goalPlan.calculatedWeeks} weeks
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default WeightGoalForm;
