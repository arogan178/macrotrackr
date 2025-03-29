import { useState, useEffect } from "react";
import { NumberField, CardContainer, FormButton } from "@/components/form";
import { EditIcon, GoalsIcon } from "@/components/Icons";
import { WeightGoalCardProps, WeightGoalFormValues } from "../types";
import { generateWeightGoalCalculations } from "../calculations";

export default function WeightGoalCard({
  currentWeight,
  targetWeight,
  tdee,
  isLoading = false,
  onSave,
  className = "",
  mode = "create",
  startDate,
  targetDate,
  progressPercentage = 0,
  weightRemaining = 0,
  insight = "You're on track with your weight goals. Keep going!",
}: WeightGoalCardProps) {
  // Get today's date in YYYY-MM-DD format for the starting date
  const todayString = new Date().toISOString().split("T")[0];

  const [formValues, setFormValues] = useState<WeightGoalFormValues>({
    currentWeight,
    targetWeight: targetWeight || undefined, // Make target weight empty by default
    startDate: startDate || todayString, // Set today as the default starting date
  });
  const [isEditing, setIsEditing] = useState(mode === "create");
  const [hasChanges, setHasChanges] = useState(false);
  const [calorieIntake, setCalorieIntake] = useState<number | undefined>(
    undefined
  );
  const [calculatedTargetDate, setCalculatedTargetDate] = useState<
    string | undefined
  >(undefined);
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<
    number | undefined
  >(undefined);
  const [calculatedWeeks, setCalculatedWeeks] = useState<number | undefined>(
    undefined
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
      targetWeight: targetWeight || undefined, // Make target weight empty by default
      startDate: startDate || todayString, // Set today as the default starting date
    });
  }, [currentWeight, targetWeight, startDate, todayString]);

  useEffect(() => {
    // Check if values have changed from props
    const isDifferent =
      formValues.currentWeight !== currentWeight ||
      formValues.targetWeight !== targetWeight ||
      calorieIntake !== undefined;

    setHasChanges(isDifferent);
  }, [formValues, currentWeight, targetWeight, calorieIntake]);

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

      // Force re-render of calculated values
      setTimeout(() => {
        setHasChanges(true);
      }, 0);
    }
  };

  const handleSave = () => {
    if (!formValues.targetWeight) return; // Don't save if target weight is empty

    // Create a complete goal object with all the calculated values
    const completeGoal = {
      ...formValues,
      adjustedCalorieIntake: calorieIntake,
      startDate: formValues.startDate || todayString, // Ensure starting date is set
      targetDate: calculatedTargetDate,
      weeklyChange: weeklyWeightChange,
      calculatedWeeks: calculatedWeeks,
      // Include weightGoal type (lose, gain, maintain)
      weightGoal:
        formValues.currentWeight > formValues.targetWeight
          ? "lose"
          : formValues.currentWeight < formValues.targetWeight
          ? "gain"
          : "maintain",
    };

    onSave(completeGoal);
    setIsEditing(false);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Format dates for display
  const formattedStartDate =
    formValues.startDate || startDate
      ? new Date(
          formValues.startDate || startDate || todayString
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Not set";

  const formattedTargetDate = targetDate
    ? new Date(targetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : calculatedTargetDate
    ? new Date(calculatedTargetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not set";

  // Determine if it's a weight loss, gain, or maintenance goal
  const isWeightLoss =
    formValues.currentWeight > (formValues.targetWeight || 0);
  const isWeightGain =
    formValues.currentWeight < (formValues.targetWeight || 0);
  const isMaintenance =
    formValues.currentWeight === formValues.targetWeight &&
    formValues.targetWeight !== undefined;

  // If we're in edit mode, show the form
  if (isEditing) {
    return (
      <CardContainer className={className}>
        <div className="p-5">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-indigo-600/20 mr-3">
              <GoalsIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-200">
              {mode === "create" ? "Set Your Weight Goal" : "Edit Weight Goal"}
            </h2>
          </div>

          <div className="space-y-5 mb-5">
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

            {/* Calorie Intake Adjustment - Now shows for maintenance goals too */}
            {tdee && calorieIntake !== undefined && formValues.targetWeight && (
              <div className="space-y-3">
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
                      isWeightLoss
                        ? tdee
                        : isMaintenance
                        ? tdee + 300
                        : tdee + 1000 // Increased from 500 to 1000 to match weight loss range
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
                  <div className="bg-gray-700/30 p-3 rounded-lg mt-3">
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
                        ? `${Math.abs(weeklyWeightChange).toFixed(
                            2
                          )} kg per week`
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
                            (isWeightLoss &&
                              Math.abs(tdee - calorieIntake) > 800) ||
                            (!isWeightLoss &&
                              Math.abs(tdee - calorieIntake) > 800)
                              ? "text-orange-400"
                              : "text-green-400"
                          }
                        >
                          {(isWeightLoss &&
                            Math.abs(tdee - calorieIntake) > 800) ||
                          (!isWeightLoss &&
                            Math.abs(tdee - calorieIntake) > 800)
                            ? "Large adjustment"
                            : "Healthy range"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {isMaintenance && (
                  <div className="bg-gray-700/30 p-3 rounded-lg mt-3">
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
          </div>

          <div className="flex justify-end gap-3">
            {mode !== "create" && (
              <FormButton
                type="button"
                variant="secondary"
                onClick={toggleEdit}
              >
                Cancel
              </FormButton>
            )}
            <FormButton
              type="button"
              variant="primary"
              disabled={!hasChanges || isLoading || !formValues.targetWeight} // Disable button when target weight is empty
              isLoading={isLoading}
              onClick={handleSave}
            >
              {mode === "create" ? "Calculate Goal" : "Update Goal"}
            </FormButton>
          </div>
        </div>
      </CardContainer>
    );
  }

  // Otherwise, show the goal details as per the design
  return (
    <CardContainer className={className}>
      <div className="p-5">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-200">
              Weight Goal Progress
            </h2>
            <p className="text-sm text-gray-400">
              Started {formattedStartDate} • Target date {formattedTargetDate}
            </p>
          </div>
          <button
            onClick={toggleEdit}
            className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-700 transition-colors"
          >
            <EditIcon className="text-gray-300" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <span className="text-2xl font-bold text-gray-200">
              {currentWeight} kg
            </span>
            <span className="mx-2 text-gray-500">→</span>
            <span className="text-xl text-gray-400">{targetWeight} kg</span>
          </div>
          {isMaintenance ? (
            <p className="text-sm text-gray-400 mb-3">
              Maintaining current weight
            </p>
          ) : (
            <p className="text-sm text-gray-400 mb-3">
              {Math.abs(currentWeight - targetWeight).toFixed(1)} kg remaining
              to reach your goal
            </p>
          )}

          <div className="flex items-center">
            <div className="flex-1 mr-3">
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium text-blue-400">
              {progressPercentage}% of goal completed
            </span>
          </div>
        </div>

        {/* Insight Section */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-indigo-400 mb-2">
            Goal Insight
          </h3>
          <div className="bg-gray-900/40 p-4 rounded-lg">
            <p className="text-sm text-gray-400">{insight}</p>
          </div>
        </div>
      </div>
    </CardContainer>
  );
}
