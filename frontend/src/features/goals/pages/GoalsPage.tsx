import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

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
import { useStore } from "@/store/store";

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

  // Get state and actions from store
  const {
    user,
    nutritionProfile,
    weightGoals,
    macroTarget,
    macroDailyTotals,
    habits,
    isLoading: goalsLoading,
    error: goalsError,
    isLoading: habitsLoading,
    error: habitsError,
    clearError,
    fetchUserDetails,
    fetchMacroData,
    fetchWeightGoals,
    fetchMacroTarget,
    fetchHabits,
    addHabit,
    updateHabit,
    incrementHabitProgress,
    completeHabit,
    deleteHabit,
    deleteWeightGoal,
    resetGoals,
    fetchWeightLog,
  } = useStore();

  // Fetch user details and macros on component mount if needed
  useEffect(() => {
    if (!user) {
      fetchUserDetails();
    }
    fetchMacroData();

    // Fetch persisted goals data
    fetchWeightGoals();
    fetchMacroTarget();
    fetchHabits();
    fetchWeightLog();
  }, [
    user,
    fetchUserDetails,
    fetchMacroData,
    fetchWeightGoals,
    fetchMacroTarget,
    fetchHabits,
    fetchWeightLog,
  ]);

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
    resetGoals();
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
    await (habitModalMode === "edit" && habitId
      ? updateHabit(habitId, values)
      : addHabit(values));

    setIsHabitModalOpen(false);
    setCurrentHabit(undefined);
  };

  // Handler to open the delete confirmation modal
  const handleOpenDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(true);
  };

  // Handler to close the delete confirmation modal
  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
  };

  // Handler to confirm and execute weight goal deletion
  const handleDeleteWeightGoalConfirmed = async () => {
    await deleteWeightGoal();
    handleCloseDeleteConfirmModal();
  };

  // Get the safe target weight value for components
  const safeTargetWeight = weightGoals?.targetWeight || user?.weight || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />

      {/* Show notifications for errors */}
      {goalsError && (
        <FloatingNotification
          message={goalsError}
          type="error"
          onClose={clearError}
          duration={5000}
        />
      )}

      {habitsError && (
        <FloatingNotification
          message={habitsError}
          type="error"
          onClose={clearError}
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
              weightGoals && weightGoals.targetWeight != undefined
                ? {
                    ...weightGoals,
                    targetWeight: weightGoals.targetWeight ?? 0,
                    weightGoal: weightGoals.weightGoal ?? "maintain",
                    startDate: weightGoals.startDate ?? "",
                    targetDate: weightGoals.targetDate ?? "",
                    calorieTarget: weightGoals.calorieTarget ?? 0,
                    calculatedWeeks: weightGoals.calculatedWeeks ?? 0,
                    weeklyChange: weightGoals.weeklyChange ?? 0,
                    dailyChange: weightGoals.dailyChange ?? 0,
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
            {goalsLoading && !user ? (
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
                          macroDailyTotals={
                            macroDailyTotals || {
                              protein: 0,
                              carbs: 0,
                              fats: 0,
                              calories: 0,
                            }
                          }
                          weightGoals={
                            weightGoals && weightGoals.targetWeight != undefined
                              ? {
                                  ...weightGoals,
                                  targetWeight: weightGoals.targetWeight ?? 0,
                                  weightGoal:
                                    weightGoals.weightGoal ?? "maintain",
                                  startDate: weightGoals.startDate ?? "",
                                  targetDate: weightGoals.targetDate ?? "",
                                  calorieTarget: weightGoals.calorieTarget ?? 0,
                                  calculatedWeeks:
                                    weightGoals.calculatedWeeks ?? 0,
                                  weeklyChange: weightGoals.weeklyChange ?? 0,
                                  dailyChange: weightGoals.dailyChange ?? 0,
                                }
                              : undefined
                          }
                          isLoading={goalsLoading}
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
                        onIncrementHabit={incrementHabitProgress}
                        onCompleteHabit={completeHabit}
                        onEditHabit={handleEditHabit}
                        onDeleteHabit={deleteHabit}
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
                      <MacroTargetForm />
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
