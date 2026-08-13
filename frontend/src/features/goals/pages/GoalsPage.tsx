import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";

import PageTransition from "@/components/animation/PageTransition";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import { GoalsIcon, TargetIcon } from "@/components/ui/Icons";
import Modal from "@/components/ui/Modal";
import TabBar from "@/components/ui/TabBar";
import HabitModal from "@/features/goals/components/habits/HabitModal";
import HabitTracker from "@/features/goals/components/habits/HabitTracker";
import MacroTargetForm from "@/features/goals/components/macros/MacroTargetForm";
import GoalsErrorState from "@/features/goals/components/ui-states/GoalsErrorState";
import GoalsLoadingSkeleton from "@/features/goals/components/ui-states/GoalsLoadingSkeleton";
import WeightGoalDashboard from "@/features/goals/components/weight-goals/WeightGoalDashboard";
import WeightGoalModal from "@/features/goals/components/weight-goals/WeightGoalModal";
import LogWeightModal from "@/features/goals/components/weight-logs/LogWeightModal";
import WeightProgressTabs from "@/features/goals/components/weight-logs/WeightProgressTabs";
import { useGoalsController } from "@/features/goals/hooks/page";
import { normalizeWeightGoals } from "@/features/goals/utils/goalUtilities";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { queryKeys } from "@/lib/queryKeys";

export default function GoalsPage() {
  const { ui, data, actions } = useGoalsController();
  const queryClient = useQueryClient();

  usePageDataSync();

  const {
    currentWeightGoals,
    user,
    nutritionProfile,
    macroTarget,
    macroDailyTotals,
    habits,
    habitsLoading,
    hasErrors,
  } = data;

  const safeTargetWeight =
    currentWeightGoals?.targetWeight ?? user?.weight ?? 0;

  const normalizedWeightGoals = useMemo(
    () => normalizeWeightGoals(currentWeightGoals ?? undefined, user?.weight),
    [currentWeightGoals, user?.weight],
  );

  const handleRetry = useCallback(() => {
    queryClient.refetchQueries({ queryKey: queryKeys.goals.all() });
    queryClient.refetchQueries({ queryKey: queryKeys.auth.user() });
  }, [queryClient]);

  return (
    <DashboardPageContainer>
      <FeaturePage
        title="Your Goals"
        subtitle="Track your progress and stay motivated on your health journey"
        headerChildren={
          <TabBar
            items={[
              {
                key: "goals",
                label: (
                  <>
                    <GoalsIcon className="h-4 w-4" />
                    Goals
                  </>
                ),
              },
              {
                key: "macro targets",
                label: (
                  <>
                    <TargetIcon className="h-4 w-4" />
                    Macro Targets
                  </>
                ),
              },
            ]}
            activeKey={ui.activeTab}
            onChange={(key) => ui.setActiveTab(key as typeof ui.activeTab)}
            layoutId="goalsTabHighlight"
            ariaLabel="Goals Tabs"
            size="sm"
          />
        }
      >
        <Modal
          isOpen={ui.isResetModalOpen}
          onClose={() => ui.setResetModalOpen(false)}
          title="Reset Goals"
          variant="confirmation"
          message="This will reset all your current goals and progress. Are you sure you want to continue?"
          confirmLabel="Reset Goals"
          cancelLabel="Cancel"
          onConfirm={actions.closeResetGoalsModal}
          isDanger
          size="md"
        />
        <Modal
          isOpen={ui.isDeleteConfirmModalOpen}
          onClose={actions.closeDeleteConfirmModal}
          title="Delete Weight Goal"
          variant="confirmation"
          message="Are you sure you want to delete your current weight goal? This action cannot be undone."
          confirmLabel="Delete Goal"
          cancelLabel="Cancel"
          onConfirm={actions.deleteWeightGoalConfirmed}
          isDanger
          size="md"
        />
        <HabitModal
          isOpen={ui.isHabitModalOpen}
          onClose={actions.closeHabitModal}
          onSubmit={actions.submitHabit}
          habit={ui.currentHabit}
          mode={ui.habitModalMode}
        />
        <LogWeightModal
          isOpen={ui.isLogWeightModalOpen}
          onClose={actions.closeLogWeightModal}
          initialWeight={user?.weight}
        />
        <WeightGoalModal
          isOpen={ui.isWeightGoalModalOpen}
          onClose={actions.closeWeightGoalModal}
          startingWeight={user?.weight ?? 0}
          targetWeight={safeTargetWeight}
          tdee={nutritionProfile?.tdee ?? 0}
          weightGoals={normalizedWeightGoals}
        />
        <div className="relative">
          {hasErrors ? (
            <GoalsErrorState
              onRetry={handleRetry}
              errorMessage="We couldn't load your goals data. This might be due to a network issue or server problem."
            />
          ) : user ? (
            <AnimatePresence mode="wait">
              {ui.activeTab === "goals" ? (
                <PageTransition key="goals">
                  <div className="space-y-6">
                    {data.safeUserSettings && (
                      <WeightGoalDashboard
                        user={data.safeUserSettings}
                        macroDailyTotals={macroDailyTotals}
                        weightGoals={normalizedWeightGoals}
                        isLoading={false}
                        onOpenModal={actions.openWeightGoalModal}
                        onDelete={actions.openDeleteConfirmModal}
                        macroTarget={macroTarget ?? undefined}
                        tdee={nutritionProfile?.tdee ?? 0}
                      />
                    )}
                    <WeightProgressTabs />
                    <HabitTracker
                      habits={habits || []}
                      isLoading={habitsLoading}
                      onAddHabit={actions.addHabit}
                      onIncrementHabit={actions.incrementHabit}
                      onCompleteHabit={actions.completeHabit}
                      onEditHabit={actions.editHabit}
                      onDeleteHabit={actions.deleteHabit}
                    />
                  </div>
                </PageTransition>
              ) : (
                <PageTransition key="macro-targets">
                  <div className="space-y-6">
                    <MacroTargetForm macroTarget={macroTarget ?? null} />
                  </div>
                </PageTransition>
              )}
            </AnimatePresence>
          ) : (
            <GoalsLoadingSkeleton />
          )}
        </div>
      </FeaturePage>
    </DashboardPageContainer>
  );
}
