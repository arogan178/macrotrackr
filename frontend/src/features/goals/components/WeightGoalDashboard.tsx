import { useState, useEffect } from "react";
import { WeightGoalFormValues, WeightGoals } from "../types";
import {
  MacroDailyTotals,
  MacroTargetSettings,
} from "@/features/macroTracking/types";
import WeightGoalForm from "./WeightGoalForm";
import WeightGoalStatus from "./WeightGoalStatus";

interface WeightGoalDashboardProps {
  currentWeight: number;
  targetWeight: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | null;
  isLoading?: boolean;
  onSave: (values: WeightGoalFormValues) => void;
  className?: string;
  targetCalories?: number;
  macroTarget?: MacroTargetSettings;
}

function WeightGoalDashboard({
  currentWeight,
  targetWeight,
  tdee,
  macroDailyTotals,
  weightGoals,
  isLoading = false,
  onSave,
  className = "",
  targetCalories,
  macroTarget,
}: WeightGoalDashboardProps) {
  // Initialize isEditing based on the initial presence of weightGoals
  const [isEditing, setIsEditing] = useState(!weightGoals);

  // Add useEffect to sync isEditing state with weightGoals prop changes
  useEffect(() => {
    // If weightGoals data arrives (is not null) and we are currently editing,
    // switch back to the status view.
    // Don't switch if weightGoals becomes null (e.g., on reset), allow staying in edit mode.
    if (weightGoals && isEditing) {
      setIsEditing(false);
    }
    // If weightGoals is null and we are NOT editing, switch to edit mode (initial setup)
    else if (!weightGoals && !isEditing) {
      setIsEditing(true);
    }
  }, [weightGoals]); // Dependency array includes weightGoals

  const handleSave = (values: WeightGoalFormValues) => {
    onSave(values);
    setIsEditing(false);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Calculate the target calories based on provided target or weight goals or fall back to TDEE
  const effectiveTargetCalories =
    targetCalories || weightGoals?.adjustedCalorieIntake || tdee;

  return (
    <div
      className={`bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden ${className}`}
    >
      {isEditing ? (
        <WeightGoalForm
          currentWeight={currentWeight}
          targetWeight={targetWeight}
          tdee={tdee}
          weightGoals={weightGoals}
          isLoading={isLoading}
          onSave={handleSave}
          onCancel={weightGoals ? toggleEdit : undefined}
        />
      ) : (
        <WeightGoalStatus
          currentWeight={currentWeight}
          targetWeight={targetWeight}
          tdee={tdee}
          macroDailyTotals={macroDailyTotals}
          weightGoals={weightGoals!}
          onEdit={toggleEdit}
          targetCalories={effectiveTargetCalories}
          macroTarget={macroTarget}
        />
      )}
    </div>
  );
}

export default WeightGoalDashboard;
