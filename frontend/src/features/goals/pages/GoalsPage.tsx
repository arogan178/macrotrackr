// src/features/goals/pages/GoalsPage.tsx

import { useLoaderData, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

import { goalsRoute } from "@/AppRouter";
import FeaturePage from "@/components/layout/FeaturePage";
import { GoalsIcon, Modal, TabButton, TargetIcon } from "@/components/ui";
import {
  GoalsLoadingSkeleton,
  LogWeightModal,
  MacroTargetForm,
  WeightGoalDashboard,
  WeightGoalModal,
  WeightProgressTabs,
} from "@/features/goals/components";
import type { WeightGoalsResponse } from "@/features/goals/types";
import { HabitModal, HabitTracker } from "@/features/habits/components";
import { HabitGoal, HabitGoalFormValues } from "@/features/habits/types/types";
import { createNutritionProfile } from "@/features/settings/utils/calculations";
import { useMutationErrorHandler } from "@/hooks";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useDeleteWeightGoal, useWeightGoals } from "@/hooks/queries/useGoals";
import {
  useAddHabit,
  useCompleteHabit,
  useDeleteHabit,
  useHabits,
  useIncrementHabitProgress,
  useUpdateHabit,
} from "@/hooks/queries/useHabits";
import {
  useMacroDailyTotals,
  useMacroTarget,
} from "@/hooks/queries/useMacroQueries"; // <-- FIX: Import the hook
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";
import type { WeightGoals } from "@/types/goal";
import type { UserDetailsResponse } from "@/utils/apiServices";

// Helper to convert UserDetailsResponse to UserSettings shape
function toUserSettings(user: UserDetailsResponse | null | undefined): any {
  if (!user) return undefined;
  return {
    ...user,
    dateOfBirth: user.dateOfBirth ?? "",
  };
}

export default function GoalsPage() {
  const {
    activeTab,
    setActiveTab,
    isResetModalOpen,
    setResetModalOpen,
    isHabitModalOpen,
    currentHabit,
    habitModalMode,
    isWeightGoalModalOpen,
    setWeightGoalModalOpen,
    isDeleteConfirmModalOpen,
    setDeleteConfirmModalOpen,
    isLogWeightModalOpen,
    setLogWeightModalOpen,
    openHabitModal,
    closeHabitModal,
    showNotification,
    setSubscriptionStatus,
  } = useStore();

  const { data: user } = useUser();

  // FIX: Use the useMacroTarget hook to get live data
  const { data: macroTarget } = useMacroTarget();

  const { data: liveMacroDailyTotals } = useMacroDailyTotals();

  const loaderData: {
    macroDailyTotals?: {
      protein: number;
      carbs: number;
      fats: number;
      calories: number;
    };
    weightGoals?: WeightGoalsResponse;
    weightLog?: any;
    weightGoalsError?: string;
  } = useLoaderData({ from: goalsRoute.id }) || {};

  const initialMacroDailyTotals = loaderData.macroDailyTotals || {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  };

  const { weightGoals, weightLog, weightGoalsError } = loaderData;

  const macroDailyTotals = liveMacroDailyTotals || initialMacroDailyTotals;

  const nutritionProfile = user
    ? createNutritionProfile(toUserSettings(user))
    : undefined;

  const {
    data: habits = [],
    isLoading: habitsLoading,
    error: habitsQueryError,
  } = useHabits();
  const addHabitMutation = useAddHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const incrementProgressMutation = useIncrementHabitProgress();
  const completeHabitMutation = useCompleteHabit();

  const { data: weightGoalsFromQuery, isLoading: weightGoalsLoading } =
    useWeightGoals();
  const deleteWeightGoalMutation = useDeleteWeightGoal();

  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => showNotification(message, "error"),
      onSuccess: (message) => showNotification(message, "success"),
    });

  usePageDataSync();

  const handleOpenWeightGoalModal = () => {
    setWeightGoalModalOpen(true);
  };

  const handleCloseWeightGoalModal = () => {
    setWeightGoalModalOpen(false);
  };

  const handleCloseLogWeightModal = () => {
    setLogWeightModalOpen(false);
  };

  const handleResetGoals = () => {
    setResetModalOpen(false);
  };

  const handleAddHabit = () => {
    openHabitModal(undefined, "add");
  };

  const handleEditHabit = (id: string) => {
    const habitToEdit = habits?.find((habit) => habit.id === id) || undefined;
    if (habitToEdit) {
      openHabitModal(habitToEdit, "edit");
    }
  };

  const handleCloseHabitModal = () => {
    closeHabitModal();
  };

  const handleSubmitHabit = async (
    values: HabitGoalFormValues,
    habitId?: string,
  ) => {
    try {
      if (habitModalMode === "edit" && habitId) {
        await updateHabitMutation.mutateAsync({ id: habitId, values });
        handleMutationSuccess("Habit updated successfully!");
      } else {
        await addHabitMutation.mutateAsync(values);
        handleMutationSuccess("Habit added successfully!");
      }
      closeHabitModal();
    } catch (error) {
      handleMutationError(
        error,
        `${habitModalMode === "edit" ? "updating" : "adding"} habit`,
      );
    }
  };

  const handleOpenDeleteConfirmModal = () => {
    setDeleteConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    setDeleteConfirmModalOpen(false);
  };

  const handleIncrementHabit = async (id: string) => {
    try {
      const originalHabit = habits.find((h) => h.id === id);
      if (!originalHabit) {
        throw new Error("Habit not found");
      }
      await incrementProgressMutation.mutateAsync(originalHabit);
      if (originalHabit.current + 1 >= originalHabit.target) {
        handleMutationSuccess(
          `🎉 Congratulations! You've completed your ${originalHabit.title}!`,
        );
      }
    } catch (error) {
      handleMutationError(error, "updating habit progress");
    }
  };

  const handleCompleteHabit = async (id: string) => {
    try {
      await completeHabitMutation.mutateAsync(id);
      const habit = habits.find((h) => h.id === id);
      if (habit && !habit.isComplete) {
        handleMutationSuccess(
          `🎉 Congratulations! You've completed your ${habit.title}!`,
        );
      }
    } catch (error) {
      handleMutationError(error, "completing habit");
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await deleteHabitMutation.mutateAsync(id);
      handleMutationSuccess("Habit deleted successfully");
    } catch (error) {
      handleMutationError(error, "deleting habit");
    }
  };

  const router = useRouter();

  const handleDeleteWeightGoalConfirmed = async () => {
    try {
      await deleteWeightGoalMutation.mutateAsync();
      handleCloseDeleteConfirmModal();
      handleMutationSuccess("Weight goal deleted successfully");
    } catch (error) {
      handleMutationError(error, "deleting weight goal");
    }
  };

  const currentWeightGoals = weightGoalsFromQuery || weightGoals;
  const safeTargetWeight =
    currentWeightGoals?.targetWeight || user?.weight || 0;

  return (
    <FeaturePage
      title="Your Goals"
      subtitle="Track your progress and stay motivated on your health journey"
      headerChildren={
        <div
          className="relative flex space-x-1 rounded-lg bg-background/60 p-1"
          role="tablist"
          aria-label="Goals Tabs"
        >
          <TabButton
            active={activeTab === "goals"}
            onClick={() => setActiveTab("goals")}
            layoutId="goalsTabHighlight"
            isMotion={true}
          >
            <span className="relative z-10 flex items-center">
              <GoalsIcon size="sm" className="mr-1.5" />
              Goals
            </span>
          </TabButton>
          <TabButton
            active={activeTab === "macro targets"}
            onClick={() => setActiveTab("macro targets")}
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
        {isResetModalOpen && (
          <Modal
            key="reset-modal"
            isOpen={isResetModalOpen}
            onClose={() => setResetModalOpen(false)}
            title="Reset Goals"
            variant="confirmation"
            message="This will reset all your current goals and progress. Are you sure you want to continue?"
            confirmLabel="Reset Goals"
            cancelLabel="Cancel"
            onConfirm={handleResetGoals}
            isDanger={true}
            size="md"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDeleteConfirmModalOpen && (
          <Modal
            key="delete-weight-goal-confirm-modal"
            isOpen={isDeleteConfirmModalOpen}
            onClose={handleCloseDeleteConfirmModal}
            title="Delete Weight Goal"
            variant="confirmation"
            message="Are you sure you want to delete your current weight goal? This action cannot be undone."
            confirmLabel="Delete Goal"
            cancelLabel="Cancel"
            onConfirm={handleDeleteWeightGoalConfirmed}
            isDanger={true}
            size="md"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isHabitModalOpen && (
          <HabitModal
            key={
              habitModalMode === "edit" && currentHabit
                ? `habit-modal-edit-${currentHabit.id}`
                : "habit-modal-add"
            }
            isOpen={isHabitModalOpen}
            onClose={handleCloseHabitModal}
            onSubmit={handleSubmitHabit}
            habit={currentHabit}
            mode={habitModalMode}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isLogWeightModalOpen && (
          <LogWeightModal
            key="log-weight-modal"
            isOpen={isLogWeightModalOpen}
            onClose={handleCloseLogWeightModal}
            initialWeight={user?.weight}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isWeightGoalModalOpen && (
          <WeightGoalModal
            key="weight-goal-modal"
            isOpen={isWeightGoalModalOpen}
            onClose={handleCloseWeightGoalModal}
            startingWeight={user?.weight || 0}
            targetWeight={safeTargetWeight}
            tdee={nutritionProfile?.tdee || 0}
            weightGoals={
              currentWeightGoals && currentWeightGoals.targetWeight != undefined
                ? ({
                    ...currentWeightGoals,
                    targetWeight: currentWeightGoals.targetWeight ?? 0,
                    weightGoal: currentWeightGoals.weightGoal ?? "maintain",
                    startDate: currentWeightGoals.startDate ?? "",
                    targetDate: currentWeightGoals.targetDate ?? "",
                    calorieTarget: currentWeightGoals.calorieTarget ?? 0,
                    calculatedWeeks: currentWeightGoals.calculatedWeeks ?? 0,
                    weeklyChange: currentWeightGoals.weeklyChange ?? 0,
                    dailyChange: currentWeightGoals.dailyChange ?? 0,
                    currentWeight: user?.weight ?? 0,
                  } as WeightGoals)
                : undefined
            }
          />
        )}
      </AnimatePresence>
      <div className="relative">
        {user ? (
          <AnimatePresence mode="wait">
            {activeTab === "goals" ? (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="space-y-6">
                  {user && (
                    <WeightGoalDashboard
                      user={toUserSettings(user)}
                      macroDailyTotals={macroDailyTotals}
                      weightGoals={
                        currentWeightGoals &&
                        currentWeightGoals.targetWeight != undefined
                          ? ({
                              ...currentWeightGoals,
                              targetWeight:
                                currentWeightGoals.targetWeight ?? 0,
                              weightGoal:
                                currentWeightGoals.weightGoal ?? "maintain",
                              startDate: currentWeightGoals.startDate ?? "",
                              targetDate: currentWeightGoals.targetDate ?? "",
                              calorieTarget:
                                currentWeightGoals.calorieTarget ?? 0,
                              calculatedWeeks:
                                currentWeightGoals.calculatedWeeks ?? 0,
                              weeklyChange:
                                currentWeightGoals.weeklyChange ?? 0,
                              dailyChange: currentWeightGoals.dailyChange ?? 0,
                              currentWeight: user?.weight ?? 0,
                            } as WeightGoals)
                          : undefined
                      }
                      isLoading={false}
                      onOpenModal={handleOpenWeightGoalModal}
                      onDelete={handleOpenDeleteConfirmModal}
                      macroTarget={macroTarget || undefined}
                      tdee={nutritionProfile?.tdee || 0}
                    />
                  )}
                  <WeightProgressTabs />
                  <HabitTracker
                    habits={habits || []}
                    isLoading={habitsLoading}
                    onAddHabit={handleAddHabit}
                    onIncrementHabit={handleIncrementHabit}
                    onCompleteHabit={handleCompleteHabit}
                    onEditHabit={handleEditHabit}
                    onDeleteHabit={handleDeleteHabit}
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
  );
}
