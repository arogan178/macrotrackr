import { useLoaderData, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

import { goalsRoute } from "@/AppRouter";
import { TabButton } from "@/components/form";
import FeaturePage from "@/components/layout/FeaturePage";
import { GoalsIcon, Modal, TargetIcon } from "@/components/ui";
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
// Notifications are handled by the global NotificationManager and store
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
  // Get UI state from centralized goals UI slice
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

  // Get user from useUser hook
  const { data: user } = useUser(); // user: UserDetailsResponse | null

  // Get macro data from goalsRoute loader
  const {
    macroTarget,
    macroDailyTotals = {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
    },
    weightGoals,
    weightLog,
    weightGoalsError,
  }: {
    macroTarget?: any;
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

  // Calculate nutritionProfile from user data
  const nutritionProfile = user
    ? createNutritionProfile(toUserSettings(user))
    : undefined;

  // Use TanStack Query hooks for habits (server state)
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

  // Use TanStack Query hooks for weight goals (server state)
  const { data: weightGoalsFromQuery, isLoading: weightGoalsLoading } =
    useWeightGoals();
  const deleteWeightGoalMutation = useDeleteWeightGoal();

  // Use new loading state hooks
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => showNotification(message, "error"),
      onSuccess: (message) => showNotification(message, "success"),
    });

  // Error handling is managed by TanStack Query's built-in mechanisms

  // Centralize subscription status hydration
  usePageDataSync();

  // Handler to open the weight goal modal
  const handleOpenWeightGoalModal = () => {
    setWeightGoalModalOpen(true);
  };

  // Handler to close the weight goal modal
  const handleCloseWeightGoalModal = () => {
    setWeightGoalModalOpen(false);
  };

  // Handler to close the log weight modal
  const handleCloseLogWeightModal = () => {
    setLogWeightModalOpen(false);
  };

  // Handler for resetting goals
  const handleResetGoals = () => {
    // Reset goals functionality can be implemented later if needed
    // For now, just close the modal
    setResetModalOpen(false);
  };

  // Handler for adding a new habit
  const handleAddHabit = () => {
    openHabitModal(undefined, "add");
  };

  // Handler for editing a habit
  const handleEditHabit = (id: string) => {
    const habitToEdit = habits?.find((habit) => habit.id === id) || undefined;
    if (habitToEdit) {
      openHabitModal(habitToEdit, "edit");
    }
  };

  // Handler for closing habit modal
  const handleCloseHabitModal = () => {
    closeHabitModal();
  };

  // Unified handler for submitting and updating habits
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

  // Handler to open the delete confirmation modal
  const handleOpenDeleteConfirmModal = () => {
    setDeleteConfirmModalOpen(true);
  };

  // Handler to close the delete confirmation modal
  const handleCloseDeleteConfirmModal = () => {
    setDeleteConfirmModalOpen(false);
  };

  // Handler for incrementing habit progress
  const handleIncrementHabit = async (id: string) => {
    try {
      // Find the original habit before mutation
      const originalHabit = habits.find((h) => h.id === id);
      if (!originalHabit) {
        throw new Error("Habit not found");
      }

      await incrementProgressMutation.mutateAsync(originalHabit);

      // Check if habit was completed
      if (originalHabit.current + 1 >= originalHabit.target) {
        handleMutationSuccess(
          `🎉 Congratulations! You've completed your ${originalHabit.title}!`,
        );
      }
    } catch (error) {
      handleMutationError(error, "updating habit progress");
    }
  };

  // Handler for completing a habit
  const handleCompleteHabit = async (id: string) => {
    try {
      await completeHabitMutation.mutateAsync(id);
      const habit = habits.find((h) => h.id === id);
      // Only show congratulations if the habit wasn't already complete
      if (habit && !habit.isComplete) {
        handleMutationSuccess(
          `🎉 Congratulations! You've completed your ${habit.title}!`,
        );
      }
    } catch (error) {
      handleMutationError(error, "completing habit");
    }
  };

  // Handler for deleting a habit
  const handleDeleteHabit = async (id: string) => {
    try {
      await deleteHabitMutation.mutateAsync(id);
      handleMutationSuccess("Habit deleted successfully");
    } catch (error) {
      handleMutationError(error, "deleting habit");
    }
  };

  // Handler to confirm and execute weight goal deletion
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

  // Use TanStack Query data instead of loader data for weight goals
  const currentWeightGoals = weightGoalsFromQuery || weightGoals;

  // Get the safe target weight value for components
  const safeTargetWeight =
    currentWeightGoals?.targetWeight || user?.weight || 0;

  return (
    <FeaturePage
      title="Your Goals"
      subtitle="Track your progress and stay motivated on your health journey"
      headerChildren={
        <div
          className="relative flex space-x-1 p-1 bg-gray-800/60 rounded-lg"
          role="tablist"
          aria-label="Goals Tabs"
        >
          <TabButton
            active={activeTab === "goals"}
            onClick={() => setActiveTab("goals")}
            layoutId="goalsTabHighlight"
            isMotion={true}
          >
            <span className="flex items-center relative z-10">
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
            <span className="flex items-center relative z-10">
              <TargetIcon size="sm" className="mr-1.5" />
              Macro Targets
            </span>
          </TabButton>
        </div>
      }
    >
      {/* Reset Goals Confirmation Modal */}
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

      {/* Delete Weight Goal Confirmation Modal */}
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

      {/* Unified Habit Modal */}
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

      {/* Log Weight Modal */}
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

      {/* Weight Goal Modal */}
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

      {/* Main Content Area */}
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
                  {/* Weight Goal Dashboard */}
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

                  {/* Weight Progress Tabs */}
                  <WeightProgressTabs />

                  {/* Habit Tracker */}
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
                  <MacroTargetForm macroTarget={macroTarget} />
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
