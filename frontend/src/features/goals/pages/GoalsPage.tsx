import { useLoaderData, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { goalsRoute } from "@/AppRouter";
import { TabButton } from "@/components/form";
import { Navbar } from "@/components/layout";
import { GoalsIcon, Modal, TargetIcon } from "@/components/ui";
import {
  GoalsLoadingSkeleton,
  LogWeightModal,
  MacroTargetForm,
  WeightGoalDashboard,
  WeightGoalModal,
  WeightProgressTabs,
} from "@/features/goals/components";
import { HabitModal, HabitTracker } from "@/features/habits/components";
import { HabitGoal, HabitGoalFormValues } from "@/features/habits/types/types";
import { FloatingNotification } from "@/features/notifications/components";
import { createNutritionProfile } from "@/features/settings/utils/calculations";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";
import {
  useAddHabit,
  useCompleteHabit,
  useDeleteHabit,
  useHabits,
  useIncrementHabitProgress,
  useUpdateHabit,
} from "@/hooks/queries/useHabits";
import { useDeleteWeightGoal, useWeightGoals } from "@/hooks/queries/useGoals";

export default function GoalsPage() {
  type TabType = "goals" | "macro targets";
  const [activeTab, setActiveTab] = useState<TabType>("goals");
  // State for reset goals modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  // State for habit modal
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [currentHabit, setCurrentHabit] = useState<HabitGoal | undefined>();
  const [habitModalMode, setHabitModalMode] = useState<"add" | "edit">("add");
  const [isWeightGoalModalOpen, setIsWeightGoalModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [isLogWeightModalOpen, setIsLogWeightModalOpen] = useState(false);

  // Get user from useUser hook
  const { data: user } = useUser();
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
  } = useLoaderData({ from: goalsRoute.id }) || {};

  // Calculate nutritionProfile from user data
  const nutritionProfile = user ? createNutritionProfile(user) : undefined;

  // Use TanStack Query hooks for habits (server state)
  const { data: habits = [], isLoading: habitsLoading, error: habitsQueryError } = useHabits();
  const addHabitMutation = useAddHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const incrementProgressMutation = useIncrementHabitProgress();
  const completeHabitMutation = useCompleteHabit();

  // Use TanStack Query hooks for weight goals (server state)
  const { data: weightGoalsFromQuery, isLoading: weightGoalsLoading } = useWeightGoals();
  const deleteWeightGoalMutation = useDeleteWeightGoal();

  // Use Zustand only for UI state (notifications, subscription status, etc.)
  const {
    setSubscriptionStatus,
    showNotification,
  } = useStore();

  // Hydrate subscriptionStatus from loader user.subscription.status
  useEffect(() => {
    if (
      user &&
      user.subscription &&
      typeof user.subscription.status === "string"
    ) {
      setSubscriptionStatus(user.subscription.status);
    }
  }, [user, setSubscriptionStatus]);

  // Handler to open the weight goal modal
  const handleOpenWeightGoalModal = () => {
    setIsWeightGoalModalOpen(true);
  };

  // Handler to close the weight goal modal
  const handleCloseWeightGoalModal = () => {
    setIsWeightGoalModalOpen(false);
  };

  // Handler to close the log weight modal
  const handleCloseLogWeightModal = () => {
    setIsLogWeightModalOpen(false);
  };

  // Handler for resetting goals
  const handleResetGoals = () => {
    // Reset goals functionality can be implemented later if needed
    // For now, just close the modal
    setIsResetModalOpen(false);
  };

  // Handler for adding a new habit
  const handleAddHabit = () => {
    setCurrentHabit(undefined);
    setHabitModalMode("add");
    setIsHabitModalOpen(true);
  };

  // Handler for editing a habit
  const handleEditHabit = (id: string) => {
    const habitToEdit = habits?.find((habit) => habit.id === id) || undefined;
    if (habitToEdit) {
      setCurrentHabit(habitToEdit);
      setHabitModalMode("edit");
      setIsHabitModalOpen(true);
    }
  };

  // Handler for closing habit modal
  const handleCloseHabitModal = () => {
    setIsHabitModalOpen(false);
    setCurrentHabit(undefined);
  };

  // Unified handler for submitting and updating habits
  const handleSubmitHabit = async (
    values: HabitGoalFormValues,
    habitId?: string,
  ) => {
    try {
      if (habitModalMode === "edit" && habitId) {
        await updateHabitMutation.mutateAsync({ id: habitId, values });
        showNotification("Habit updated successfully!", "success");
      } else {
        await addHabitMutation.mutateAsync(values);
        showNotification("Habit added successfully!", "success");
      }
      setIsHabitModalOpen(false);
      setCurrentHabit(undefined);
    } catch (error) {
      showNotification(`Failed to ${habitModalMode === "edit" ? "update" : "add"} habit`, "error");
    }
  };

  // Handler to open the delete confirmation modal
  const handleOpenDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(true);
  };

  // Handler to close the delete confirmation modal
  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
  };

  // Handler for incrementing habit progress
  const handleIncrementHabit = async (id: string) => {
    try {
      await incrementProgressMutation.mutateAsync(id);
      // Check if habit was completed
      const habit = habits.find((h) => h.id === id);
      if (habit && habit.current + 1 >= habit.target) {
        showNotification(`🎉 Congratulations! You've completed your ${habit.title}!`, "success");
      }
    } catch (error) {
      showNotification("Failed to update habit progress", "error");
    }
  };

  // Handler for completing a habit
  const handleCompleteHabit = async (id: string) => {
    console.log('handleCompleteHabit called with id:', id);
    try {
      console.log('About to call completeHabitMutation.mutateAsync');
      await completeHabitMutation.mutateAsync(id);
      console.log('completeHabitMutation.mutateAsync completed');
      const habit = habits.find((h) => h.id === id);
      // Only show congratulations if the habit wasn't already complete
      if (habit && !habit.isComplete) {
        showNotification(`🎉 Congratulations! You've completed your ${habit.title}!`, "success");
      }
    } catch (error) {
      console.error('Error in handleCompleteHabit:', error);
      showNotification("Failed to complete habit", "error");
    }
  };

  // Handler for deleting a habit
  const handleDeleteHabit = async (id: string) => {
    try {
      await deleteHabitMutation.mutateAsync(id);
      showNotification("Habit deleted successfully", "info");
    } catch (error) {
      showNotification("Failed to delete habit", "error");
    }
  };

  // Handler to confirm and execute weight goal deletion
  const router = useRouter();

  const handleDeleteWeightGoalConfirmed = async () => {
    try {
      await deleteWeightGoalMutation.mutateAsync();
      handleCloseDeleteConfirmModal();
      showNotification("Weight goal deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting weight goal:", error);
      showNotification("Failed to delete weight goal", "error");
    }
  };

  // Use TanStack Query data instead of loader data for weight goals
  const currentWeightGoals = weightGoalsFromQuery || weightGoals;
  
  // Get the safe target weight value for components
  const safeTargetWeight = currentWeightGoals?.targetWeight || user?.weight || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />

      {/* Show notifications for errors */}
      {weightGoalsError && (
        <FloatingNotification
          message={weightGoalsError}
          type="error"
          onClose={() => {}}
          duration={5000}
        />
      )}

      {habitsQueryError && (
        <FloatingNotification
          message="Failed to load habits"
          type="error"
          onClose={() => {}}
          duration={5000}
        />
      )}

      {/* Reset Goals Confirmation Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <Modal
            key="reset-modal"
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
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
                ? {
                    ...currentWeightGoals,
                    targetWeight: currentWeightGoals.targetWeight ?? 0,
                    weightGoal: currentWeightGoals.weightGoal ?? "maintain",
                    startDate: currentWeightGoals.startDate ?? "",
                    targetDate: currentWeightGoals.targetDate ?? "",
                    calorieTarget: currentWeightGoals.calorieTarget ?? 0,
                    calculatedWeeks: currentWeightGoals.calculatedWeeks ?? 0,
                    weeklyChange: currentWeightGoals.weeklyChange ?? 0,
                    dailyChange: currentWeightGoals.dailyChange ?? 0,
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <div className="relative min-h-screen pb-12 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none" />
        <div className="absolute top-40 -left-32 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-24 -right-32 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Page Header with Tabs */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight mb-2">
                Your Goals
              </h1>
              <p className="text-gray-400 max-w-2xl">
                Track your progress and stay motivated on your health journey
              </p>
            </div>
            {/* Tab Navigation */}
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
          </div>

          {/* Main Content Area */}
          <div className="mt-8 relative">
            {!user ? (
              <GoalsLoadingSkeleton />
            ) : (
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
                          user={user}
                          macroDailyTotals={macroDailyTotals}
                          weightGoals={
                            currentWeightGoals && currentWeightGoals.targetWeight != undefined
                              ? {
                                  ...currentWeightGoals,
                                  targetWeight: currentWeightGoals.targetWeight ?? 0,
                                  weightGoal:
                                    currentWeightGoals.weightGoal ?? "maintain",
                                  startDate: currentWeightGoals.startDate ?? "",
                                  targetDate: currentWeightGoals.targetDate ?? "",
                                  calorieTarget: currentWeightGoals.calorieTarget ?? 0,
                                  calculatedWeeks:
                                    currentWeightGoals.calculatedWeeks ?? 0,
                                  weeklyChange: currentWeightGoals.weeklyChange ?? 0,
                                  dailyChange: currentWeightGoals.dailyChange ?? 0,
                                }
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
