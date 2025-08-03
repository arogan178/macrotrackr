import { useEffect, useMemo, useState } from "react";

import { NumberField } from "@/components/form";
import { Button } from "@/components/ui";
import type { WeightGoals } from "@/types/goal";

import { generateWeightGoalCalculations } from "../calculations";
import { WeightGoalFormValues } from "../types";

interface WeightGoalFormProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  weightGoals: WeightGoals | undefined; // If this exists, we are editing
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

  // When switching between edit/create, update calorieIntake if not user-adjusted
  useEffect(() => {
    if (!isEditing) {
      setCalorieIntake(calculations?.calorieTarget);
    } else if (weightGoals?.calorieTarget) {
      setCalorieIntake(weightGoals.calorieTarget);
    }
  }, [isEditing, weightGoals?.calorieTarget, calculations?.calorieTarget]);

  // Derived values for display
  const calculatedTargetDate = calculations?.targetDate;
  const weeklyWeightChange = calculations?.weeklyChange;
  const calculatedWeeks = calculations?.calculatedWeeks;

  const [hasChanges, setHasChanges] = useState(false);

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

  return (
    <div className="p-6">
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <NumberField
          label="Starting Weight"
          value={formValues.startingWeight}
          onChange={(value: number | undefined) =>
            setFormValues({ ...formValues, startingWeight: value || 0 })
          }
          unit="kg"
          min={30}
          max={300}
          step={0.1}
          required
          // Disable only if editing an existing goal (weightGoals is not undefined)
          disabled={Boolean(weightGoals)}
        />

        <NumberField
          label="Target Weight"
          value={formValues.targetWeight}
          onChange={(value: number | undefined) =>
            setFormValues({ ...formValues, targetWeight: value })
          }
          unit="kg"
          min={30}
          max={300}
          step={0.1}
          required
        />
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
            <span className="text-sm text-foreground">
              {calorieIntake} calories/day
            </span>
          </div>

          <div className="relative">
            <input
              id="calorie-intake-range"
              type="range"
              min={
                isWeightLoss
                  ? Math.max(tdee - 1000, 1200)
                  : isMaintenance
                    ? tdee - 300
                    : tdee
              }
              max={
                isWeightLoss ? tdee : isMaintenance ? tdee + 300 : tdee + 1000
              }
              step={50}
              value={calorieIntake}
              onChange={(event) =>
                handleCalorieIntakeChange(Number(event.target.value))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface outline-none"
            />
            <div className="mt-1 flex justify-between text-xs text-foreground">
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
            <div className="rounded-lg bg-surface/30 p-3">
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
              <p className="mt-1 text-xs text-foreground">
                Expected change:{" "}
                {typeof weeklyWeightChange === "number" &&
                !Number.isNaN(weeklyWeightChange)
                  ? `${Math.abs(weeklyWeightChange).toFixed(2)} kg per week`
                  : "0 kg per week"}
              </p>
              <p className="mt-1 text-xs text-foreground">
                Estimated duration:{" "}
                {calculatedWeeks === undefined
                  ? "Calculating..."
                  : `${calculatedWeeks} weeks`}
              </p>
              <div className="mt-2 border-t border-border/30 pt-2">
                <p className="flex justify-between text-xs text-foreground">
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
            <div className="rounded-lg bg-surface/30 p-3">
              <p className="text-sm text-foreground">
                <span className="font-medium">Maintenance Goal</span>
              </p>
              <p className="mt-1 text-xs text-foreground">
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
          disabled={!hasChanges || isLoading || !formValues.targetWeight} // Use isLoading prop
          isLoading={isLoading} // Pass isLoading prop to button
          onClick={handleSave}
        >
          {weightGoals ? "Update Goal" : "Set Goal"}{" "}
        </Button>
      </div>
    </div>
  );
}

export default WeightGoalForm;
