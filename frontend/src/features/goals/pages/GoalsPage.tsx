// src/features/goals/pages/GoalsPage.tsx

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

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
import { queryKeys } from "@/lib/queryKeys";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import type { WeightGoals } from "@/types/goal";

export default function GoalsPage() {
  // Ensure the hook import path is correct and name is in scope
  const { ui, data, actions } = useGoalsPage();
  const queryClient = useQueryClient();

  usePageDataSync();

  const currentWeightGoals = data.currentWeightGoals;
  const user = data.user;
  const nutritionProfile = data.nutritionProfile;
  const macroTarget = data.macroTarget;
  const macroDailyTotals = data.macroDailyTotals;
  const habits = data.habits;
  const habitsLoading = data.habitsLoading;
  const hasErrors = data.hasErrors;
  const safeTargetWeight =
    currentWeightGoals?.targetWeight || user?.weight || 0;

  // Memoize normalized weight goals to prevent infinite re-renders in WeightGoalForm
  const normalizedWeightGoals = useMemo(
    () => normalizeWeightGoalsFromResponse(currentWeightGoals, user?.weight),
    [currentWeightGoals, user?.weight],
  );

  const handleRetry = () => {
    // Refetch all goal-related queries
    queryClient.refetchQueries({ queryKey: queryKeys.goals.all() });
    queryClient.refetchQueries({ queryKey: queryKeys.auth.user() });
  };

  return (
    <DashboardPageContainer>
      <FeaturePage
        title="Your Goals"
        subtitle="Track your progress and stay motivated on your health journey"
        headerChildren={
          <div
            className="relative flex space-x-1 rounded-lg bg-background p-1"
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
        <AnimatePresence>
          {ui.isResetModalOpen && (
            <Modal
              key="reset-modal"
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
          )}
        </AnimatePresence>
        <AnimatePresence>
          {ui.isDeleteConfirmModalOpen && (
            <Modal
              key="delete-weight-goal-confirm-modal"
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
          )}
        </AnimatePresence>
        <AnimatePresence>
          {ui.isHabitModalOpen && (
            <HabitModal
              key={
                ui.habitModalMode === "edit" && ui.currentHabit
                  ? `habit-modal-edit-${ui.currentHabit.id}`
                  : "habit-modal-add"
              }
              isOpen={ui.isHabitModalOpen}
              onClose={actions.closeHabitModal}
              onSubmit={actions.submitHabit}
              habit={ui.currentHabit}
              mode={ui.habitModalMode}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {ui.isLogWeightModalOpen && (
            <LogWeightModal
              key="log-weight-modal"
              isOpen={ui.isLogWeightModalOpen}
              onClose={actions.closeLogWeightModal}
              initialWeight={user?.weight}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {ui.isWeightGoalModalOpen && (
            <WeightGoalModal
              key="weight-goal-modal"
              isOpen={ui.isWeightGoalModalOpen}
              onClose={actions.closeWeightGoalModal}
              startingWeight={user?.weight || 0}
              targetWeight={safeTargetWeight}
              tdee={nutritionProfile?.tdee || 0}
              weightGoals={normalizedWeightGoals}
            />
          )}
        </AnimatePresence>
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
                        macroTarget={macroTarget || undefined}
                        tdee={nutritionProfile?.tdee || 0}
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
                    {/* eslint-disable-next-line unicorn/no-null */}
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
// Local helper to normalize WeightGoalsResponse to WeightGoals without changing behavior
function normalizeWeightGoalsFromResponse(
  goals:
    | import("@/features/goals/types").WeightGoalsResponse
    | WeightGoals
    | undefined,
  userWeight: number | undefined,
): WeightGoals | undefined {
  if (!goals) return undefined;

  // If it's already a WeightGoals (from query in some cases), return as-is with safe defaults
  if ("currentWeight" in goals) {
    const g = goals as WeightGoals;
    return {
      startingWeight: g.startingWeight ?? 0,
      currentWeight: g.currentWeight ?? userWeight ?? 0,
      targetWeight: g.targetWeight ?? 0,
      weightGoal: g.weightGoal ?? "maintain",
      startDate: g.startDate ?? "",
      targetDate: g.targetDate ?? "",
      calorieTarget: g.calorieTarget ?? 0,
      calculatedWeeks: g.calculatedWeeks ?? 0,
      weeklyChange: g.weeklyChange ?? 0,
      dailyChange: g.dailyChange ?? 0,
    };
  }

  // Otherwise it's a WeightGoalsResponse (loader shape) — map to WeightGoals
  const r = goals as import("@/features/goals/types").WeightGoalsResponse;
  if (r.targetWeight === undefined) return undefined;
  // Prevent premature 100% progress: if we have no explicit current weight yet
  // and the only source is userWeight which equals the target while starting differs,
  // treat current weight as starting weight until a log entry updates it.
  const starting = r.startingWeight;
  const target = r.targetWeight ?? 0;
  const tentativeCurrent = userWeight ?? starting;
  // Progress glitch fix:
  // When the loader response does not yet include a derived currentWeight and there are
  // no weight log entries, we previously defaulted currentWeight to userWeight. If the
  // userWeight already equals the new targetWeight (common after finishing a prior goal
  // and immediately setting a new, more aggressive target), progress falsely rendered
  // as 100% until a refresh. To prevent this, treat the current weight as the starting
  // weight in the specific case where:
  //   - startingWeight !== targetWeight (active non-maintenance goal)
  //   - userWeight (tentativeCurrent) === targetWeight
  // This defers showing full completion until an actual weight log entry moves the
  // currentWeight toward the target.
  const currentWeight =
    starting !== target && tentativeCurrent === target
      ? starting
      : tentativeCurrent;

  return {
    startingWeight: starting,
    currentWeight,
    targetWeight: target,
    weightGoal: (r as any).weightGoal ?? "maintain",
    startDate: (r as any).startDate ?? "",
    targetDate: (r as any).targetDate ?? "",
    calorieTarget: (r as any).calorieTarget ?? 0,
    calculatedWeeks: (r as any).calculatedWeeks ?? 0,
    weeklyChange: (r as any).weeklyChange ?? 0,
    dailyChange: (r as any).dailyChange ?? 0,
  } as WeightGoals;
}
