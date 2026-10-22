import { memo, useMemo } from "react";
import { calculateTrendWeights } from "@shared/trendWeight";

import CardContainer from "@/components/form/CardContainer";
import { StateCard, TargetIcon } from "@/components/ui/";
import { WeightGoalSkeleton } from "@/features/goals/components/ui-states/GoalsLoadingSkeleton";
import { computeEffectiveTargetCalories } from "@/features/goals/utils/calorie";
import { getTrendChange } from "@/features/goals/utils/weightLogUtilities";
import { useFeatureLoading } from "@/hooks";
import { useWeightLog } from "@/hooks/queries/useGoals";
import { cn } from "@/lib/classnameUtilities";
import { useStore } from "@/store/store";
import type { WeightGoals } from "@/types/goal";
import type { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import type { UserSettings } from "@/types/user";
import type { UnitSystem } from "@/utils/unitConversion";

import WeightGoalStatus from "./WeightGoalStatus";

interface WeightGoalDashboardProps {
  user: UserSettings;
  tdee: number;
  tdeeIsOverride?: boolean;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: WeightGoals | undefined | null;
  isLoading?: boolean;
  onOpenModal: () => void;
  onDelete: () => void;
  className?: string;
  macroTarget?: MacroTargetSettings;
  unitSystem?: UnitSystem;
}

const WeightGoalDashboard = memo(function WeightGoalDashboard({
  user,
  tdee,
  tdeeIsOverride = false,
  macroDailyTotals,
  weightGoals,
  isLoading = false,
  onOpenModal,
  onDelete,
  className = "",
  macroTarget,
  unitSystem = "metric",
}: WeightGoalDashboardProps) {
  // Use new loading state hooks
  const { isLoading: _isGoalsLoading } = useFeatureLoading("goals");

  // Get log weight modal state from centralized goals UI slice
  const { setLogWeightModalOpen } = useStore();

  const { data: weightLog = [] } = useWeightLog();
  const trendPoints = useMemo(() => calculateTrendWeights(weightLog), [weightLog]);

  // Handler for Log Weight Modal
  function handleOpenLogWeightModal() {
    setLogWeightModalOpen(true);
  }

  // TDEE is now passed as a prop and should be used directly

  // Get daily deficit/surplus from weightGoals via shared helper

  // Calculate effective target calories via shared helper
  const effectiveTargetCalories = computeEffectiveTargetCalories(
    tdee,
    weightGoals ?? undefined,
  );

  // Loading State
  if (isLoading) {
    return <WeightGoalSkeleton />;
  }

  // Empty State
  if (!weightGoals) {
    return (
      <CardContainer className={className}>
        <StateCard
          title="Set your weight goal"
          message="Define your target weight and let us help you calculate the right calorie intake to reach it."
          icon={<TargetIcon className="h-14 w-14 text-primary" />}
          action={{
            label: "Set weight goal",
            onClick: onOpenModal, // Trigger modal open
            variant: "primary",
          }}
          secondaryAction={{
            label: "Log weight",
            onClick: handleOpenLogWeightModal,
          }}
          size="md"
          className="py-10" // Adjust padding if needed
        />
      </CardContainer>
    );
  }

  // Status View (when weightGoals exist)
  return (
    <div className={cn("h-full", className)}>
      <WeightGoalStatus
        startingWeight={user.weight ?? 0}
        targetWeight={weightGoals.targetWeight}
        tdee={Number.isFinite(tdee) ? tdee : 0}
        tdeeIsOverride={tdeeIsOverride}
        macroDailyTotals={macroDailyTotals}
        weightGoals={weightGoals}
        onEdit={onOpenModal}
        onDelete={onDelete}
        onLogWeight={handleOpenLogWeightModal}
        targetCalories={
          Number.isFinite(effectiveTargetCalories) ? effectiveTargetCalories : 0
        }
        macroTarget={macroTarget}
        unitSystem={unitSystem}
        trendWeight={trendPoints.at(-1)?.trend}
        trendChange={getTrendChange(trendPoints)}
      />
    </div>
  );
});

export default WeightGoalDashboard;
