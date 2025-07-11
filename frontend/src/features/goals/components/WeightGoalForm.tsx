import { useEffect, useState } from "react";

import { FormButton, NumberField } from "@/components/form";
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

  const [formValues, setFormValues] = useState<WeightGoalFormValues>({
    startingWeight: startingWeight,
    targetWeight: targetWeight || undefined,
    startDate: todayString,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [calorieIntake, setCalorieIntake] = useState<number | undefined>(
    weightGoals?.calorieTarget,
  );
  const [calculatedTargetDate, setCalculatedTargetDate] = useState<
    string | undefined
  >(weightGoals?.targetDate);
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<
    number | undefined
  >(weightGoals?.weeklyChange);
  const [calculatedWeeks, setCalculatedWeeks] = useState<number | undefined>(
    weightGoals?.calculatedWeeks,
  );

  // Calculate default calorie intake based on TDEE and weight goals
  useEffect(() => {
    if (tdee && formValues.startingWeight && formValues.targetWeight) {
      const calculations = generateWeightGoalCalculations(
        tdee,
        formValues.startingWeight,
        formValues.targetWeight,
      );
      setCalorieIntake(calculations.calorieTarget);
      setCalculatedTargetDate(calculations.targetDate);
      setWeeklyWeightChange(calculations.weeklyChange);
      setCalculatedWeeks(calculations.calculatedWeeks);
    }
  }, [tdee, formValues.startingWeight, formValues.targetWeight]);

  useEffect(() => {
    setFormValues({
      startingWeight,
      targetWeight: targetWeight || undefined,
      startDate: weightGoals?.startDate || todayString,
    });
  }, [startingWeight, targetWeight, weightGoals, todayString]);

  useEffect(() => {
    // Check if values have changed from props
    const isDifferent =
      formValues.startingWeight !== startingWeight ||
      formValues.targetWeight !== targetWeight ||
      calorieIntake !== weightGoals?.calorieTarget;

    setHasChanges(isDifferent);
  }, [formValues, startingWeight, targetWeight, calorieIntake, weightGoals]);

  // Update calculations when calorie intake changes
  const handleCalorieIntakeChange = (value: number | undefined) => {
    setCalorieIntake(value);

    if (value && tdee && formValues.startingWeight && formValues.targetWeight) {
      // Generate new calculations based on the adjusted calorie intake
      const calculations = generateWeightGoalCalculations(
        tdee,
        formValues.startingWeight,
        formValues.targetWeight,
        value,
      );

      // Update all calculation-dependent state values
      setCalculatedTargetDate(calculations.targetDate);
      setWeeklyWeightChange(calculations.weeklyChange);
      setCalculatedWeeks(calculations.calculatedWeeks);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (!formValues.targetWeight || !calorieIntake) return;

    // Calculate daily change (deficit/surplus)
    // For weight loss: dailyChange = calorieIntake - tdee (negative value)
    // For weight gain: dailyChange = calorieIntake - tdee (positive value)
    // For maintenance: dailyChange = calorieIntake - tdee (around 0)
    const dailyChange = calorieIntake - tdee;

    const completeGoal = {
      startingWeight: formValues.startingWeight!, // Ensure startingWeight is included from form state
      targetWeight: formValues.targetWeight,
      calorieTarget: calorieIntake,
      startDate: formValues.startDate || todayString,
      targetDate: calculatedTargetDate,
      weeklyChange: weeklyWeightChange,
      calculatedWeeks: calculatedWeeks,
      dailyChange: dailyChange, // Add the calculated daily change
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <NumberField
          label="Starting Weight"
          value={formValues.startingWeight}
          // Restore onChange handler
          onChange={(value) =>
            setFormValues({ ...formValues, startingWeight: value || 0 })
          }
          unit="kg"
          min={30}
          max={300}
          step={0.1}
          required
          // Disable only if editing an existing goal (weightGoals is not undefined)
          disabled={!!weightGoals}
        />

        <NumberField
          label="Target Weight"
          value={formValues.targetWeight}
          onChange={(value) =>
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
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <label
              htmlFor="calorie-intake-range"
              className="block text-sm font-medium text-gray-200"
            >
              Daily Calorie Intake
            </label>
            <span className="text-sm text-gray-400">
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
              className="appearance-none w-full h-2 bg-gray-700 rounded-lg outline-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
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
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <p className="text-sm text-gray-300">
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
              <p className="text-xs text-gray-400 mt-1">
                Expected change:{" "}
                {weeklyWeightChange === undefined
                  ? "Calculating..."
                  : `${Math.abs(weeklyWeightChange).toFixed(2)} kg per week`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Estimated duration:{" "}
                {calculatedWeeks === undefined
                  ? "Calculating..."
                  : `${calculatedWeeks} weeks`}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-600/30">
                <p className="text-xs text-gray-400 flex justify-between">
                  <span>
                    {isWeightLoss
                      ? `Deficit: ${Math.abs(tdee - calorieIntake)} kcal`
                      : `Surplus: ${Math.abs(tdee - calorieIntake)} kcal`}
                  </span>
                  <span
                    className={
                      (isWeightLoss && Math.abs(tdee - calorieIntake) > 800) ||
                      (!isWeightLoss && Math.abs(tdee - calorieIntake) > 800)
                        ? "text-orange-400"
                        : "text-green-400"
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
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <p className="text-sm text-gray-300">
                <span className="font-medium">Maintenance Goal</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
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
          <FormButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </FormButton>
        )}
        <FormButton
          type="button"
          variant="primary"
          disabled={!hasChanges || isLoading || !formValues.targetWeight} // Use isLoading prop
          isLoading={isLoading} // Pass isLoading prop to button
          onClick={handleSave}
        >
          {weightGoals ? "Update Goal" : "Set Goal"}{" "}
        </FormButton>
      </div>
    </div>
  );
}

export default WeightGoalForm;
