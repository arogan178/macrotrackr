import { useEffect, useMemo, useState, useCallback } from "react";

import { NumberField } from "@/components/form";
import { Button, RangeSlider } from "@/components/ui";
import type { WeightGoals } from "@/types/goal";

import { generateWeightGoalCalculations } from "../calculations";
import { WeightGoalFormValues } from "../types";

interface WeightGoalFormProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  weightGoals: WeightGoals | undefined | null; // If this exists, we are editing
  isLoading?: boolean; // Prop received from modal (bound to store's isSaving)
  onSave: (values: WeightGoalFormValues) => void;
  onCancel?: () => void;
}

function WeightGoalForm({
  startingWeight,
  targetWeight,
  tdee,
  weightGoals,
  isLoading = false, // Use the prop passed from the modal
  onSave,
  onCancel,
}: WeightGoalFormProps) {
  // Get today's date in YYYY-MM-DD format for the starting date
  const todayString = new Date().toISOString().split("T")[0];

  // Track if editing or creating
  const isEditing = Boolean(weightGoals);

  // Only initialize form state on mount or when switching between edit/create
  const [formValues, setFormValues] = useState<WeightGoalFormValues>(() => ({
    startingWeight: weightGoals?.startingWeight ?? startingWeight,
    targetWeight: weightGoals?.targetWeight ?? targetWeight ?? startingWeight,
    startDate: weightGoals?.startDate ?? todayString,
  }));

  // When switching between edit/create, reset form state
  useEffect(() => {
    setFormValues({
      startingWeight: weightGoals?.startingWeight ?? startingWeight,
      targetWeight: weightGoals?.targetWeight ?? targetWeight ?? startingWeight,
      startDate: weightGoals?.startDate ?? todayString,
    });
  }, [weightGoals, startingWeight, targetWeight, todayString]);

  // Calorie intake is either user-adjusted or default from calculations
  const [calorieIntake, setCalorieIntake] = useState<number | undefined>(
    weightGoals?.calorieTarget ?? undefined,
  );

  // Recalculate all derived values when calorieIntake or form values change
  const calculations = useMemo(() => {
    return tdee && formValues.startingWeight && formValues.targetWeight
      ? generateWeightGoalCalculations(
          tdee,
          formValues.startingWeight,
          formValues.targetWeight,
          calorieIntake,
        )
      : undefined;
  }, [tdee, formValues.startingWeight, formValues.targetWeight, calorieIntake]);

  // Initialize calorie intake when modal opens or switches between edit/create
  // Only run when isEditing or weightGoals changes, NOT when calculations change
  useEffect(() => {
    if (!isEditing) {
      // Creating new goal - use calculated default
      const defaultCalories =
        tdee && formValues.startingWeight && formValues.targetWeight
          ? generateWeightGoalCalculations(
              tdee,
              formValues.startingWeight,
              formValues.targetWeight,
              undefined,
            )?.calorieTarget
          : undefined;
      setCalorieIntake(defaultCalories);
    } else if (weightGoals?.calorieTarget !== undefined) {
      // Editing existing goal - use saved value
      setCalorieIntake(weightGoals.calorieTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, weightGoals]);

  // Derived values for display
  const calculatedTargetDate = calculations?.targetDate;
  const weeklyWeightChange = calculations?.weeklyChange;
  const calculatedWeeks = calculations?.calculatedWeeks;

  const [hasChanges, setHasChanges] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    startingWeight?: string;
    targetWeight?: string;
  }>({});

  // Validation functions
  const validateWeight = (value: number | undefined, fieldName: string): string | undefined => {
    if (value === undefined || value === null) {
      return `${fieldName} is required`;
    }
    if (value < 30) {
      return `${fieldName} must be at least 30 kg`;
    }
    if (value > 300) {
      return `${fieldName} must be at most 300 kg`;
    }
    return undefined;
  };

  // Keyboard shortcut: Ctrl+Enter to save
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter" && hasChanges && !isLoading && formValues.targetWeight) {
        event.preventDefault();
        handleSave();
      }
    },
    [hasChanges, isLoading, formValues.targetWeight],
  );

  // Track if form has changes compared to initial values
  useEffect(() => {
    if (isEditing && weightGoals) {
      // For editing, check if values have changed from existing goal
      setHasChanges(
        formValues.startingWeight !== weightGoals.startingWeight ||
          formValues.targetWeight !== weightGoals.targetWeight ||
          calorieIntake !== weightGoals.calorieTarget,
      );
    } else {
      // For creating new goals, always allow saving if we have valid values
      // This ensures maintenance goals (starting = target weight) can be created
      setHasChanges(
        formValues.startingWeight !== undefined &&
          formValues.targetWeight !== undefined &&
          calorieIntake !== undefined &&
          formValues.startingWeight > 0 &&
          formValues.targetWeight > 0 &&
          calorieIntake > 0,
      );
    }
  }, [
    formValues,
    startingWeight,
    targetWeight,
    calorieIntake,
    weightGoals,
    isEditing,
  ]);

  // Attach keyboard shortcut listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Update calculations when calorie intake slider is changed
  const handleCalorieIntakeChange = (value: number | undefined) => {
    setCalorieIntake(value);
  };

  const handleSave = () => {
    if (!formValues.targetWeight || !calorieIntake) return;

    // Calculate daily change (deficit/surplus)
    const dailyChange = calorieIntake - tdee;

    const completeGoal = {
      startingWeight: formValues.startingWeight!,
      targetWeight: formValues.targetWeight,
      calorieTarget: calorieIntake,
      startDate: formValues.startDate || todayString,
      targetDate: calculatedTargetDate,
      weeklyChange: weeklyWeightChange,
      calculatedWeeks: calculatedWeeks,
      dailyChange: dailyChange,
      weightGoal:
        formValues.startingWeight! > formValues.targetWeight!
          ? "lose"
          : formValues.startingWeight! < formValues.targetWeight!
            ? "gain"
            : "maintain",
    };

    onSave(completeGoal);
  };

  // Determine if it's a weight loss, gain, or maintenance goal
  const isWeightLoss =
    formValues.startingWeight! > (formValues.targetWeight || 0);
  // const isWeightGain =
  //   formValues.startingWeight < (formValues.targetWeight || 0);
  const isMaintenance =
    formValues.startingWeight === formValues.targetWeight &&
    formValues.targetWeight !== undefined;

  const minCalorieIntake = isWeightLoss
    ? Math.max(tdee - 1000, 1200)
    : isMaintenance
      ? tdee - 300
      : tdee;

  const maxCalorieIntake = isWeightLoss
    ? tdee
    : isMaintenance
      ? tdee + 300
      : tdee + 1000;

  useEffect(() => {
    if (calorieIntake === undefined) return;
    const clamped = Math.min(
      maxCalorieIntake,
      Math.max(minCalorieIntake, calorieIntake),
    );
    if (clamped !== calorieIntake) {
      setCalorieIntake(clamped);
    }
  }, [calorieIntake, minCalorieIntake, maxCalorieIntake]);

  return (
    <div className="p-6">
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <NumberField
            label="Starting Weight"
            value={formValues.startingWeight}
            onChange={(value: number | undefined) => {
              setFormValues({ ...formValues, startingWeight: value || 0 });
              const error = validateWeight(value, "Starting weight");
              setFieldErrors((prev) => ({ ...prev, startingWeight: error }));
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
            <p className="mt-1 text-sm text-red-500">{fieldErrors.startingWeight}</p>
          )}
        </div>

        <div>
          <NumberField
            label="Target Weight"
            value={formValues.targetWeight}
            onChange={(value: number | undefined) => {
              setFormValues({ ...formValues, targetWeight: value });
              const error = validateWeight(value, "Target weight");
              setFieldErrors((prev) => ({ ...prev, targetWeight: error }));
            }}
            unit="kg"
            min={30}
            max={300}
            step={0.1}
            required
          />
          {fieldErrors.targetWeight && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.targetWeight}</p>
          )}
        </div>
      </div>
      {tdee && calorieIntake !== undefined && formValues.targetWeight && (
        <div className="mb-6 space-y-3">
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
            onChange={(value) => handleCalorieIntakeChange(value)}
            min={minCalorieIntake}
            max={maxCalorieIntake}
            step={50}
            showFillTrack={true}
            trackColorClass="bg-vibrant-accent"
            ariaLabelledBy="calorie-intake-range"
            unit="calories"
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
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
              <div className="mt-2 border-t border-border/30 pt-2">
                <p className="flex justify-between text-xs text-muted">
                  <span>
                    {(() => {
                      const diff = Math.abs(tdee - calorieIntake);
                      const displayDiff = Math.max(diff, 50);
                      return isWeightLoss
                        ? `Deficit: ${displayDiff} kcal`
                        : `Surplus: ${displayDiff} kcal`;
                    })()}
                  </span>
                  <span
                    className={
                      (isWeightLoss && Math.abs(tdee - calorieIntake) > 800) ||
                      (!isWeightLoss && Math.abs(tdee - calorieIntake) > 800)
                        ? "text-vibrant-accent"
                        : "text-success"
                    }
                  >
                    {(isWeightLoss && Math.abs(tdee - calorieIntake) > 800) ||
                    (!isWeightLoss && Math.abs(tdee - calorieIntake) > 800)
                      ? "Large adjustment"
                      : "Healthy range"}
                  </span>
                </p>
              </div>
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

      <div className="flex justify-end gap-3">
        {weightGoals && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          disabled={!hasChanges || isLoading || !formValues.targetWeight || fieldErrors.startingWeight || fieldErrors.targetWeight}
          isLoading={isLoading}
          onClick={handleSave}
        >
          {weightGoals ? "Update Goal" : "Set Goal"}
        </Button>
      </div>
    </div>
  );
}

export default WeightGoalForm;
