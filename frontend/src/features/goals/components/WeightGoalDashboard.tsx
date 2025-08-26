import { memo } from "react";

import { EmptyState, TargetIcon } from "@/components/ui/";
import { computeEffectiveTargetCalories } from "@/features/goals/utils/calorie";
import { useFeatureLoading } from "@/hooks";
import { useStore } from "@/store/store";
import type { WeightGoals } from "@/types/goal";
import type { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import type { UserSettings } from "@/types/user";

import WeightGoalStatus from "./WeightGoalStatus";

interface WeightGoalDashboardProps {
  user: UserSettings;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | undefined | null;
  isLoading?: boolean;
  onOpenModal: () => void;
  onDelete: () => void;
  className?: string;
  macroTarget?: MacroTargetSettings;
}

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
  // Use new loading state hooks
  const { isLoading: _isGoalsLoading } = useFeatureLoading("goals");

  // Get log weight modal state from centralized goals UI slice
  const { setLogWeightModalOpen } = useStore();

  // Handler for Log Weight Modal
  function handleOpenLogWeightModal() {
    setLogWeightModalOpen(true);
  }

  // TDEE is now passed as a prop and should be used directly

  // Get daily deficit/surplus from weightGoals via shared helper

  // Calculate effective target calories via shared helper
  const effectiveTargetCalories = computeEffectiveTargetCalories(
    tdee,
    weightGoals || undefined,
  );

  // Loading State
  if (isLoading) {
    return (
      <div
        className={`flex h-60 animate-pulse items-center justify-center rounded-2xl bg-surface ${className}`}
      >
        <div className="h-full w-full rounded-2xl bg-surface" />
      </div>
    );
  }

  // Empty State
  if (!weightGoals) {
    return (
      <div className={`rounded-2xl bg-surface ${className}`}>
        <EmptyState
          title="Set Your Weight Goal"
          message="Define your target weight and let us help you calculate the right calorie intake to reach it."
          icon={
            <TargetIcon className="h-14 w-14 text-primary" strokeWidth={1} />
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
      <div className={`rounded-2xl bg-surface ${className}`}>
        <WeightGoalStatus
          startingWeight={user.weight ?? 0}
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
    </>
  );
});

export default WeightGoalDashboard;
