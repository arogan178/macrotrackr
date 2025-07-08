import { useState } from "react";
import type { WeightGoals } from "@/types/goal";
import type { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import type { UserSettings } from "@/types/user";
import WeightGoalStatus from "./WeightGoalStatus";
import EmptyState from "@/components/EmptyState";
import { TargetIcon } from "@/components/Icons";
import LogWeightModal from "./LogWeightModal";

interface WeightGoalDashboardProps {
  user: UserSettings;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | null;
  isLoading?: boolean;
  onOpenModal: () => void;
  onDelete: () => void;
  className?: string;
  macroTarget?: MacroTargetSettings;
}

import { memo } from "react";

const WeightGoalDashboard = memo(function WeightGoalDashboard({
  user,
  tdee,
  macroDailyTotals,
  weightGoals,
  isLoading = false,
  onOpenModal,
  onDelete,
  className = "",
  macroTarget,
}: WeightGoalDashboardProps) {
  // State for Log Weight Modal
  const [isLogWeightModalOpen, setIsLogWeightModalOpen] = useState(false);

  // Handlers for Log Weight Modal
  function handleOpenLogWeightModal() {
    setIsLogWeightModalOpen(true);
  }

  function handleCloseLogWeightModal() {
    setIsLogWeightModalOpen(false);
  }

  // TDEE is now passed as a prop and should be used directly

  // Get daily deficit/surplus from weightGoals
  // If dailyChange is null, calculate it from TDEE and calorieTarget
  let dailyAdjustment = weightGoals?.dailyChange || 0;
  if (dailyAdjustment === 0 && weightGoals?.calorieTarget && tdee > 0) {
    // Calculate daily deficit/surplus: deficit is positive, surplus is negative
    dailyAdjustment = tdee - weightGoals.calorieTarget;
  }

  // Calculate effective target calories
  let effectiveTargetCalories: number = Number.isFinite(tdee) ? tdee : 0;
  if (weightGoals?.calorieTarget) {
    effectiveTargetCalories = weightGoals.calorieTarget;
  }
  // Always ensure it's a finite number
  if (!Number.isFinite(effectiveTargetCalories)) {
    effectiveTargetCalories = 0;
  }

  // Loading State
  if (isLoading) {
    return (
      <div
        className={`bg-gray-800/40 rounded-2xl h-60 flex items-center justify-center animate-pulse ${className}`}
      >
        <div className="w-full h-full bg-gray-700 rounded-2xl" />
      </div>
    );
  }

  // Empty State
  if (!weightGoals) {
    return (
      <div className={`bg-gray-800/40 rounded-2xl ${className}`}>
        <EmptyState
          title="Set Your Weight Goal"
          message="Define your target weight and let us help you calculate the right calorie intake to reach it."
          icon={
            <TargetIcon className="h-14 w-14 text-indigo-400" strokeWidth={1} />
          }
          action={{
            label: "Set Weight Goal",
            onClick: onOpenModal, // Trigger modal open
            variant: "primary",
          }}
          size="md"
          className="py-10" // Adjust padding if needed
        />
      </div>
    );
  }

  // Status View (when weightGoals exist)
  return (
    <>
      <div className={`bg-gray-800/40 rounded-2xl ${className}`}>
        <WeightGoalStatus
          startingWeight={user.weight ?? 0} // Pass current weight for progress, fallback to 0
          targetWeight={weightGoals.targetWeight}
          tdee={Number.isFinite(tdee) ? tdee : 0}
          macroDailyTotals={macroDailyTotals}
          weightGoals={weightGoals}
          onEdit={onOpenModal}
          onDelete={onDelete}
          onLogWeight={handleOpenLogWeightModal}
          targetCalories={
            Number.isFinite(effectiveTargetCalories)
              ? effectiveTargetCalories
              : 0
          }
          macroTarget={macroTarget}
        />
      </div>

      {/* Render the Log Weight Modal */}
      <LogWeightModal
        isOpen={isLogWeightModalOpen}
        onClose={handleCloseLogWeightModal}
      />
    </>
  );
});

export default WeightGoalDashboard;
