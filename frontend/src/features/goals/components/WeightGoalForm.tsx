import { useState, useEffect } from "react";
import { NumberField, FormButton } from "@/components/form";
import { GoalsIcon } from "@/components/Icons";
import { WeightGoalFormValues } from "../types";
import { generateWeightGoalCalculations } from "../calculations";

interface WeightGoalFormProps {
  currentWeight: number;
  targetWeight: number;
  tdee: number;
  weightGoals: any | null;
  isLoading?: boolean;
  onSave: (values: WeightGoalFormValues) => void;
  onCancel?: () => void;
}

function WeightGoalForm({
  currentWeight,
  targetWeight,
  tdee,
  weightGoals,
  isLoading = false,
  onSave,
  onCancel,
}: WeightGoalFormProps) {
  // Get today's date in YYYY-MM-DD format for the starting date
  const todayString = new Date().toISOString().split("T")[0];

  const [formValues, setFormValues] = useState<WeightGoalFormValues>({
    currentWeight,
    targetWeight: targetWeight || undefined,
    startDate: todayString,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [calorieIntake, setCalorieIntake] = useState<number | undefined>(
    weightGoals?.adjustedCalorieIntake
  );
  const [calculatedTargetDate, setCalculatedTargetDate] = useState<
    string | undefined
  >(weightGoals?.targetDate);
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<
    number | undefined
  >(weightGoals?.weeklyChange);
  const [calculatedWeeks, setCalculatedWeeks] = useState<number | undefined>(
    weightGoals?.calculatedWeeks
  );

  // Calculate default calorie intake based on TDEE and weight goals
  useEffect(() => {
    if (tdee && formValues.currentWeight && formValues.targetWeight) {
      const calculations = generateWeightGoalCalculations(
        tdee,
        formValues.currentWeight,
        formValues.targetWeight
      );
      setCalorieIntake(calculations.adjustedCalorieIntake);
      setCalculatedTargetDate(calculations.targetDate);
      setWeeklyWeightChange(calculations.weeklyChange);
      setCalculatedWeeks(calculations.calculatedWeeks);
    }
  }, [tdee, formValues.currentWeight, formValues.targetWeight]);

  useEffect(() => {
    setFormValues({
      currentWeight,
      targetWeight: targetWeight || undefined,
      startDate: weightGoals?.startDate || todayString,
    });
  }, [currentWeight, targetWeight, weightGoals, todayString]);

  useEffect(() => {
    // Check if values have changed from props
    const isDifferent =
      formValues.currentWeight !== currentWeight ||
      formValues.targetWeight !== targetWeight ||
      calorieIntake !== weightGoals?.adjustedCalorieIntake;

    setHasChanges(isDifferent);
  }, [formValues, currentWeight, targetWeight, calorieIntake, weightGoals]);

  // Update calculations when calorie intake changes
  const handleCalorieIntakeChange = (value: number | undefined) => {
    setCalorieIntake(value);

    if (value && tdee && formValues.currentWeight && formValues.targetWeight) {
      // Generate new calculations based on the adjusted calorie intake
      const calculations = generateWeightGoalCalculations(
        tdee,
        formValues.currentWeight,
        formValues.targetWeight,
        value
      );

      // Update all calculation-dependent state values
      setCalculatedTargetDate(calculations.targetDate);
      setWeeklyWeightChange(calculations.weeklyChange);
      setCalculatedWeeks(calculations.calculatedWeeks);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (!formValues.targetWeight) return;

    // Create a complete goal object with all the calculated values
    const completeGoal = {
      ...formValues,
      adjustedCalorieIntake: calorieIntake,
      startDate: formValues.startDate || todayString,
      targetDate: calculatedTargetDate,
      weeklyChange: weeklyWeightChange,
      calculatedWeeks: calculatedWeeks,
      weightGoal:
        formValues.currentWeight > formValues.targetWeight
          ? "lose"
          : formValues.currentWeight < formValues.targetWeight
          ? "gain"
          : "maintain",
    };

    onSave(completeGoal);
  };

  // Determine if it's a weight loss, gain, or maintenance goal
  const isWeightLoss =
    formValues.currentWeight > (formValues.targetWeight || 0);
  const isWeightGain =
    formValues.currentWeight < (formValues.targetWeight || 0);
  const isMaintenance =
    formValues.currentWeight === formValues.targetWeight &&
    formValues.targetWeight !== undefined;

  return (
    <div className="p-6">
      <div className="flex items-center mb-5">
        <div className="p-2 rounded-lg bg-indigo-600/20 mr-3">
          <GoalsIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200">
          {!weightGoals ? "Set Your Weight Goal" : "Edit Weight Goal"}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <NumberField
          label="Current Weight (kg)"
          value={formValues.currentWeight}
          onChange={(value) =>
            setFormValues({ ...formValues, currentWeight: value || 0 })
          }
          min={30}
          max={300}
          step={0.1}
          required
          helperText="Your current weight in kilograms"
        />

        <NumberField
          label="Target Weight (kg)"
          value={formValues.targetWeight}
          onChange={(value) =>
            setFormValues({ ...formValues, targetWeight: value })
          }
          min={30}
          max={300}
          step={0.1}
          required
          helperText="Your goal weight in kilograms"
        />
      </div>

      {tdee && calorieIntake !== undefined && formValues.targetWeight && (
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-200">
              Daily Calorie Intake
            </label>
            <span className="text-sm text-gray-400">
              {calorieIntake} calories/day
            </span>
          </div>

          <div className="relative">
            <input
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
              onChange={(e) =>
                handleCalorieIntakeChange(Number(e.target.value))
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
                        }
                      )
                    : "Calculating..."}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Expected change:{" "}
                {weeklyWeightChange !== undefined
                  ? `${Math.abs(weeklyWeightChange).toFixed(2)} kg per week`
                  : "Calculating..."}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Estimated duration:{" "}
                {calculatedWeeks !== undefined
                  ? `${calculatedWeeks} weeks`
                  : "Calculating..."}
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
          <FormButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            size="md"
          >
            Cancel
          </FormButton>
        )}
        <FormButton
          type="button"
          variant="primary"
          disabled={!hasChanges || isLoading || !formValues.targetWeight}
          isLoading={isLoading}
          onClick={handleSave}
          size="md"
        >
          {!weightGoals ? "Calculate Goal" : "Update Goal"}
        </FormButton>
      </div>
    </div>
  );
}

export default WeightGoalForm;
