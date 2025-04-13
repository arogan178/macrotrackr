import { useState } from "react";
import { WeightGoals } from "../types";
import {
  MacroDailyTotals,
  MacroTargetSettings,
} from "@/features/macroTracking/types";
import WeightGoalStatus from "./WeightGoalStatus";
import EmptyState from "@/components/EmptyState";
import { LoadingSpinnerIcon, TargetIcon } from "@/components/Icons";
import LogWeightModal from "./LogWeightModal"; // Import the modal

interface WeightGoalDashboardProps {
  startingWeight: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | null;
  isLoading?: boolean;
  onOpenModal: () => void;
  onDelete: () => void;
  className?: string;
  targetCalories?: number;
  macroTarget?: MacroTargetSettings;
}

function WeightGoalDashboard({
  startingWeight,
  tdee,
  macroDailyTotals,
  weightGoals,
  isLoading = false,
  onOpenModal,
  onDelete,
  className = "",
  targetCalories,
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

  // Calculate the target calories based on provided target or weight goals or fall back to TDEE
  const effectiveTargetCalories =
    targetCalories || weightGoals?.calorieTarget || tdee;

  // Loading State
  if (isLoading) {
    return (
      <div
        className={`bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden flex items-center justify-center h-60 ${className}`}
      >
        <LoadingSpinnerIcon className="h-10 w-10 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // Empty State
  if (!weightGoals) {
    return (
      <div
        className={`bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden ${className}`}
      >
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
      <div
        className={`bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden ${className}`}
      >
        <WeightGoalStatus
          startingWeight={startingWeight}
          targetWeight={weightGoals.targetWeight}
          tdee={tdee}
          macroDailyTotals={macroDailyTotals}
          weightGoals={weightGoals}
          onEdit={onOpenModal}
          onDelete={onDelete}
          onLogWeight={handleOpenLogWeightModal} // Pass the open handler
          targetCalories={effectiveTargetCalories}
          macroTarget={macroTarget}
        />
      </div>

      {/* Render the Log Weight Modal */}
      <LogWeightModal
        isOpen={isLogWeightModalOpen}
        onClose={handleCloseLogWeightModal}
        // Optionally pass initialWeight if available, e.g., from latest log
        // initialWeight={latestWeightLog?.weight}
      />
    </>
  );
}

export default WeightGoalDashboard;
