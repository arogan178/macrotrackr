import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import { NumberField } from "@/components/form";
import { RangeSlider } from "@/components/ui";
import type { WeightGoals } from "@/types/goal";
import { todayISO } from "@/utils/dateUtilities";

import { generateWeightGoalCalculations } from "../calculations";
import { CALORIE_RANGE_LABELS } from "../constants";
import { WeightGoalFormValues } from "../types";

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
}

type GoalType = keyof typeof CALORIE_RANGE_LABELS;

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
    ? `Deficit: ${displayDiff} kcal`
    : `Surplus: ${displayDiff} kcal`;
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
    },
    reference,
  ) {
    const todayString = todayISO();
    const isEditing = Boolean(weightGoals);

    const [formValues, setFormValues] = useState<WeightGoalFormValues>(() => ({
      startingWeight: weightGoals?.startingWeight ?? startingWeight,
      targetWeight: weightGoals?.targetWeight ?? targetWeight ?? startingWeight,
      startDate: weightGoals?.startDate ?? todayString,
    }));

    useEffect(() => {
      setFormValues({
        startingWeight: weightGoals?.startingWeight ?? startingWeight,
        targetWeight:
          weightGoals?.targetWeight ?? targetWeight ?? startingWeight,
        startDate: weightGoals?.startDate ?? todayString,
      });
    }, [weightGoals, startingWeight, targetWeight, todayString]);

    const [calorieIntake, setCalorieIntake] = useState<number | undefined>(
      weightGoals?.calorieTarget,
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
        )?.calorieTarget;
        setCalorieIntake(defaultCalories);
      }
    }, [
      isEditing,
      weightGoals,
      tdee,
      formValues.startingWeight,
      formValues.targetWeight,
    ]);

    const {
      targetDate: calculatedTargetDate,
      weeklyChange: weeklyWeightChange,
      calculatedWeeks,
    } = calculations ?? {};

    const [hasChanges, setHasChanges] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{
      startingWeight?: string;
      targetWeight?: string;
    }>({});

    const validateWeight = useCallback(
      (value: number | undefined, fieldName: string): string | undefined => {
        if (value == undefined) return `${fieldName} is required`;
        if (value < 30) return `${fieldName} must be at least 30 kg`;
        if (value > 300) return `${fieldName} must be at most 300 kg`;
        return undefined;
      },
      [],
    );

    const handleSave = useCallback(() => {
      if (!formValues.targetWeight || !calorieIntake) return;

      const dailyChange = calorieIntake - tdee;
      const goalType = getGoalType(
        formValues.startingWeight,
        formValues.targetWeight,
      );

      onSave({
        ...(isEditing ? {} : { startingWeight: formValues.startingWeight! }),
        targetWeight: formValues.targetWeight,
        calorieTarget: calorieIntake,
        startDate: formValues.startDate || todayString,
        targetDate: calculatedTargetDate,
        weeklyChange: weeklyWeightChange,
        calculatedWeeks,
        dailyChange,
        weightGoal: goalType,
      });
    }, [
      formValues,
      calorieIntake,
      tdee,
      calculatedTargetDate,
      weeklyWeightChange,
      calculatedWeeks,
      onSave,
      todayString,
      isEditing,
    ]);

    // Expose save method to parent via ref
    useImperativeHandle(
      reference,
      () => ({
        save: handleSave,
      }),
      [handleSave],
    );

    // Keyboard shortcut: Ctrl+Enter to save
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (
          event.ctrlKey &&
          event.key === "Enter" &&
          hasChanges &&
          !isLoading &&
          formValues.targetWeight
        ) {
          event.preventDefault();
          handleSave();
        }
      },
      [hasChanges, isLoading, formValues.targetWeight, handleSave],
    );

    useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Track form changes
    useEffect(() => {
      if (isEditing && weightGoals) {
        setHasChanges(
          formValues.startingWeight !== weightGoals.startingWeight ||
            formValues.targetWeight !== weightGoals.targetWeight ||
            calorieIntake !== weightGoals.calorieTarget,
        );
      } else {
        setHasChanges(
          formValues.startingWeight != undefined &&
            formValues.targetWeight != undefined &&
            calorieIntake != undefined &&
            formValues.startingWeight > 0 &&
            formValues.targetWeight > 0 &&
            calorieIntake > 0,
        );
      }
    }, [formValues, calorieIntake, weightGoals, isEditing]);

    // Notify parent about save state
    const canSave =
      hasChanges &&
      !isLoading &&
      formValues.targetWeight != undefined &&
      !fieldErrors.startingWeight &&
      !fieldErrors.targetWeight;

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
    }, [calorieIntake, minCalorieIntake, maxCalorieIntake]);

    const calorieLabels = CALORIE_RANGE_LABELS[goalType];
    const adjustmentInfo =
      calorieIntake == undefined
        ? null
        : getCalorieAdjustmentInfo(tdee, calorieIntake, isWeightLoss);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <NumberField
              label="Starting Weight"
              value={formValues.startingWeight}
              onChange={(value: number | undefined) => {
                setFormValues({ ...formValues, startingWeight: value || 0 });
                const error = validateWeight(value, "Starting weight");
                setFieldErrors((previous) => ({
                  ...previous,
                  startingWeight: error,
                }));
              }}
              unit="kg"
              min={30}
              max={300}
              step={0.1}
              required
              // Disable only if editing an existing goal (weightGoals is not undefined)
              disabled={Boolean(weightGoals)}
            />
            {fieldErrors.startingWeight && (
              <p className="mt-1 text-sm text-red-500">
                {fieldErrors.startingWeight}
              </p>
            )}
          </div>

          <div>
            <NumberField
              label="Target Weight"
              value={formValues.targetWeight}
              onChange={(value: number | undefined) => {
                setFormValues({ ...formValues, targetWeight: value });
                const error = validateWeight(value, "Target weight");
                setFieldErrors((previous) => ({
                  ...previous,
                  targetWeight: error,
                }));
              }}
              unit="kg"
              min={30}
              max={300}
              step={0.1}
              required
            />
            {fieldErrors.targetWeight && (
              <p className="mt-1 text-sm text-red-500">
                {fieldErrors.targetWeight}
              </p>
            )}
          </div>
        </div>
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
                {calorieIntake} calories/day
              </span>
            </div>

            <RangeSlider
              value={calorieIntake}
              onChange={setCalorieIntake}
              min={minCalorieIntake}
              max={maxCalorieIntake}
              step={50}
              showFillTrack={true}
              trackColorClass="bg-vibrant-accent"
              ariaLabelledBy="calorie-intake-range"
              unit="calories"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>{calorieLabels.min}</span>
              <span>TDEE ({tdee})</span>
              <span>{calorieLabels.max}</span>
            </div>

            {!isMaintenance && (
              <div className="rounded-lg bg-surface p-3">
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
                    ? `${Math.abs(weeklyWeightChange).toFixed(2)} kg per week`
                    : "0 kg per week"}
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
              <div className="rounded-lg bg-surface p-3">
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
