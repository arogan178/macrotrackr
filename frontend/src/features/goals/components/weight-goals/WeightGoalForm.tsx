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
import { generateWeightGoalCalculations } from "@/utils/nutritionCalculations";
import {
  formatWeight,
  type UnitSystem,
  weightLimits,
  weightUnit,
} from "@/utils/unitConversion";

import { CALORIE_RANGE_LABELS } from "../../constants";
import { WeightGoalFormValues } from "../../types";

export interface WeightGoalFormHandle {
  save: () => void;
}

interface WeightGoalFormProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  weightGoals: WeightGoals | undefined | null;
  isLoading?: boolean;
  onSave: (values: WeightGoalFormValues) => void;
  onCancel?: () => void;
  /** Callback to report whether the form can be saved */
  onCanSaveChange?: (canSave: boolean) => void;
  unitSystem?: UnitSystem;
}

type GoalType = keyof typeof CALORIE_RANGE_LABELS;

const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 300;

// Weights are stored in kg; the messages speak the user's unit.
const validateWeight =
  (label: string, unitSystem: UnitSystem) =>
  ({ value }: { value: number | undefined }) => {
    const { min, max } = weightLimits(MIN_WEIGHT_KG, MAX_WEIGHT_KG, unitSystem);
    const unit = weightUnit(unitSystem);
    if (value === undefined) return `${label} is required`;
    if (value < MIN_WEIGHT_KG) return `${label} must be at least ${min} ${unit}`;
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

// Calculate calorie range based on goal type
const getCalorieRange = (
  tdee: number,
  goalType: GoalType,
): { min: number; max: number } => {
  const ranges = {
    lose: { min: Math.max(tdee - 1000, 1200), max: tdee },
    maintain: { min: tdee - 300, max: tdee + 300 },
    gain: { min: tdee, max: tdee + 1000 },
  };

  return ranges[goalType];
};

// Get deficit/surplus display info
const getCalorieAdjustmentInfo = (
  tdee: number,
  calorieIntake: number,
  isWeightLoss: boolean,
): { label: string; isLargeAdjustment: boolean } => {
  const diff = Math.abs(tdee - calorieIntake);
  const displayDiff = Math.max(diff, 50);
  const label = isWeightLoss
    ? `Deficit: ${formatGrouped(displayDiff)} kcal`
    : `Surplus: ${formatGrouped(displayDiff)} kcal`;
  const isLargeAdjustment = diff > 800;

  return { label, isLargeAdjustment };
};

const WeightGoalForm = forwardRef<WeightGoalFormHandle, WeightGoalFormProps>(
  function WeightGoalForm(
    {
      startingWeight,
      targetWeight,
      tdee,
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

    const form = useForm({
      defaultValues: {
        startingWeight: (weightGoals?.startingWeight ?? startingWeight) as
          | number
          | undefined,
        targetWeight: (weightGoals?.targetWeight ?? targetWeight) as
          | number
          | undefined,
        calorieTarget: weightGoals?.calorieTarget,
      },
      onSubmit: ({ value }) => {
        if (!value.targetWeight || !value.calorieTarget) return;

        onSave({
          ...(isEditing ? {} : { startingWeight: value.startingWeight! }),
          targetWeight: value.targetWeight,
          calorieTarget: value.calorieTarget,
          startDate: weightGoals?.startDate ?? todayString,
          targetDate: calculatedTargetDate,
          weeklyChange: weeklyWeightChange,
          calculatedWeeks,
          dailyChange: value.calorieTarget - tdee,
          weightGoal: getGoalType(value.startingWeight, value.targetWeight),
        });
      },
    });
    const formValues = useStore(form.store, (state) => state.values);
    const isFormValid = useStore(form.store, (state) => state.isValid);
    const calorieIntake = formValues.calorieTarget;
    const setCalorieIntake = useCallback(
      (calories: number) => form.setFieldValue("calorieTarget", calories),
      [form],
    );

    const calculations = useMemo(() => {
      if (!tdee || !formValues.startingWeight || !formValues.targetWeight)
        return undefined;

      return generateWeightGoalCalculations(
        tdee,
        formValues.startingWeight,
        formValues.targetWeight,
        calorieIntake,
      );
    }, [
      tdee,
      formValues.startingWeight,
      formValues.targetWeight,
      calorieIntake,
    ]);

    // Initialize calorie intake when modal opens or switches between edit/create
    useEffect(() => {
      if (isEditing && weightGoals?.calorieTarget !== undefined) {
        setCalorieIntake(weightGoals.calorieTarget);

        return;
      }

      if (
        !isEditing &&
        tdee &&
        formValues.startingWeight &&
        formValues.targetWeight
      ) {
        const defaultCalories = generateWeightGoalCalculations(
          tdee,
          formValues.startingWeight,
          formValues.targetWeight,
          undefined,
        ).calorieTarget;
        setCalorieIntake(defaultCalories);
      }
    }, [
      isEditing,
      weightGoals,
      tdee,
      formValues.startingWeight,
      formValues.targetWeight,
      setCalorieIntake,
    ]);

    const {
      targetDate: calculatedTargetDate,
      weeklyChange: weeklyWeightChange,
      calculatedWeeks,
    } = calculations ?? {};

    const hasChanges =
      isEditing && weightGoals
        ? formValues.startingWeight !== weightGoals.startingWeight ||
          formValues.targetWeight !== weightGoals.targetWeight ||
          calorieIntake !== weightGoals.calorieTarget
        : formValues.startingWeight != undefined &&
          formValues.targetWeight != undefined &&
          calorieIntake != undefined &&
          formValues.startingWeight > 0 &&
          formValues.targetWeight > 0 &&
          calorieIntake > 0;

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

    const goalType = getGoalType(
      formValues.startingWeight,
      formValues.targetWeight,
    );
    const isWeightLoss = goalType === "lose";
    const isMaintenance = goalType === "maintain";

    const { min: minCalorieIntake, max: maxCalorieIntake } = getCalorieRange(
      tdee,
      goalType,
    );

    // Clamp calorie intake to valid range
    useEffect(() => {
      if (calorieIntake == undefined) return;
      const clamped = Math.min(
        maxCalorieIntake,
        Math.max(minCalorieIntake, calorieIntake),
      );
      if (clamped !== calorieIntake) {
        setCalorieIntake(clamped);
      }
    }, [calorieIntake, minCalorieIntake, maxCalorieIntake, setCalorieIntake]);

    const calorieLabels = CALORIE_RANGE_LABELS[goalType];
    const adjustmentInfo =
      calorieIntake == undefined
        ? null
        : getCalorieAdjustmentInfo(tdee, calorieIntake, isWeightLoss);

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

        {tdee && calorieIntake !== undefined && formValues.targetWeight && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="calorie-intake-range"
                className="block text-sm font-medium text-foreground"
              >
                Daily Calorie Intake
              </label>
              <span className="text-sm text-muted">
                {formatGrouped(calorieIntake)} calories/day
              </span>
            </div>

            <RangeSlider
              value={calorieIntake}
              onChange={setCalorieIntake}
              min={minCalorieIntake}
              max={maxCalorieIntake}
              step={50}
              showFillTrack
              trackColorClass="bg-primary"
              ariaLabelledBy="calorie-intake-range"
              unit="calories"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>{calorieLabels.min}</span>
              <span>TDEE ({tdee})</span>
              <span>{calorieLabels.max}</span>
            </div>

            {!isMaintenance && (
              <div className="rounded-control bg-surface p-3">
                <p className="text-sm text-foreground">
                  <span className="font-medium">
                    Estimated completion:{" "}
                    {calculatedTargetDate
                      ? new Date(calculatedTargetDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "Calculating..."}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  Expected change:{" "}
                  {typeof weeklyWeightChange === "number" &&
                  !Number.isNaN(weeklyWeightChange)
                    ? `${formatWeight(Math.abs(weeklyWeightChange), unitSystem, 2)} per week`
                    : `0 ${weightUnit(unitSystem)} per week`}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Estimated duration:{" "}
                  {calculatedWeeks === undefined
                    ? "Calculating..."
                    : `${calculatedWeeks} weeks`}
                </p>
                {adjustmentInfo && (
                  <div className="mt-2 border-t border-border pt-2">
                    <p className="flex justify-between text-xs text-muted">
                      <span>{adjustmentInfo.label}</span>
                      <span
                        className={
                          adjustmentInfo.isLargeAdjustment
                            ? "text-warning"
                            : "text-success"
                        }
                      >
                        {adjustmentInfo.isLargeAdjustment
                          ? "Large adjustment"
                          : "Healthy range"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {isMaintenance && (
              <div className="rounded-control bg-surface p-3">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Maintenance Goal</span>
                </p>
                <p className="mt-1 text-xs text-muted">
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
      </div>
    );
  },
);

export default WeightGoalForm;
