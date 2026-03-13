// src/features/goals/pages/GoalsPage.tsx

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import { GoalsIcon, TargetIcon } from "@/components/ui/Icons";
import Modal from "@/components/ui/Modal";
import TabButton from "@/components/ui/TabButton";
import GoalsErrorState from "@/features/goals/components/GoalsErrorState";
import GoalsLoadingSkeleton from "@/features/goals/components/GoalsLoadingSkeleton";
import HabitModal from "@/features/goals/components/habits/HabitModal";
import HabitTracker from "@/features/goals/components/habits/HabitTracker";
import LogWeightModal from "@/features/goals/components/LogWeightModal";
import MacroTargetForm from "@/features/goals/components/MacroTargetForm";
import WeightGoalDashboard from "@/features/goals/components/WeightGoalDashboard";
import WeightGoalModal from "@/features/goals/components/WeightGoalModal";
import WeightProgressTabs from "@/features/goals/components/WeightProgressTabs";
import { useGoalsPage } from "@/features/goals/hooks/page";
import { normalizeWeightGoals } from "@/features/goals/utils/goalUtilities";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { queryKeys } from "@/lib/queryKeys";

export default function GoalsPage() {
  const { ui, data, actions } = useGoalsPage();
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
    () => normalizeWeightGoals(currentWeightGoals, user?.weight),
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
          <div
            className="relative flex space-x-1 rounded-xl bg-surface p-1"
            role="tablist"
            aria-label="Goals Tabs"
          >
            <TabButton
              active={ui.activeTab === "goals"}
              onClick={() => ui.setActiveTab("goals")}
              layoutId="goalsTabHighlight"
              isMotion={true}
            >
              <span className="relative z-10 flex items-center">
                <GoalsIcon size="sm" className="mr-1.5" />
                Goals
              </span>
            </TabButton>
            <TabButton
              active={ui.activeTab === "macro targets"}
              onClick={() => ui.setActiveTab("macro targets")}
              layoutId="goalsTabHighlight"
              isMotion={true}
            >
              <span className="relative z-10 flex items-center">
                <TargetIcon size="sm" className="mr-1.5" />
                Macro Targets
              </span>
            </TabButton>
          </div>
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
          onConfirm={actions.resetGoals}
          isDanger={true}
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
          isDanger={true}
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
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
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
                </motion.div>
              ) : (
                <motion.div
                  key="macro-targets"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="space-y-6">
                    {/* Prop expects MacroTargetSettings | null */}
                    <MacroTargetForm macroTarget={macroTarget ?? null} />
                  </div>
                </motion.div>
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
