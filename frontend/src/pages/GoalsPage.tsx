import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react"; // Keep AnimatePresence for tab transitions
import { Navbar } from "@/features/layout/components";
import {
  AchievementsContent,
  WeightGoalDashboard,
  WeightGoalModal,
} from "@/features/goals/components";
import { HabitTracker, HabitModal } from "@/features/habits/components";
import { HabitGoalFormValues, HabitGoal } from "@/features/habits/types";
import { WeightGoalFormValues } from "@/features/goals/types";
import { FloatingNotification } from "@/features/notifications/components";
import { useStore } from "@/store/store";
import { TabButton } from "@/components/form";
import { GoalsIcon, StarIcon, PlusIcon } from "@/components/Icons";
import Modal from "@/components/Modal";

export default function GoalsPage() {
  // State for tab navigation
  const [activeTab, setActiveTab] = useState<"active" | "achieved">("active");
  // State for reset goals modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  // State for habit modal
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [currentHabit, setCurrentHabit] = useState<HabitGoal | null>(null);
  const [habitModalMode, setHabitModalMode] = useState<"add" | "edit">("add");
  const [isWeightGoalModalOpen, setIsWeightGoalModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);

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
    createWeightGoal,
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
    deleteWeightGoal, // Add deleteWeightGoal action
    resetGoals,
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
  }, [
    user,
    fetchUserDetails,
    fetchMacroData,
    fetchWeightGoals,
    fetchMacroTarget,
    fetchHabits,
  ]);

  // Updated handler for saving weight goal - now also closes modal
  const handleSaveGoal = async (formValues: WeightGoalFormValues) => {
    if (!nutritionProfile?.tdee) return;
    console.log("Saving weight goal:", formValues); // DEBUG
    await createWeightGoal(formValues, nutritionProfile.tdee);
    handleCloseWeightGoalModal(); // Use the close handler
  };

  // Handler to open the weight goal modal
  const handleOpenWeightGoalModal = () => {
    console.log("Opening weight goal modal..."); // DEBUG
    setIsWeightGoalModalOpen(true);
  };

  // Handler to close the habit modal
  const handleCloseHabitModal = () => {
    setIsHabitModalOpen(false);
    // Resetting currentHabit immediately is fine here
    setCurrentHabit(null);
  };

  // Handler to close the weight goal modal
  const handleCloseWeightGoalModal = () => {
    console.log("Closing weight goal modal..."); // DEBUG
    setIsWeightGoalModalOpen(false);
  };

  // Handler for resetting goals
  const handleResetGoals = () => {
    resetGoals();
    setIsResetModalOpen(false);
  };

  // Handler for adding a new habit
  const handleAddHabit = () => {
    setCurrentHabit(null);
    setHabitModalMode("add");
    setIsHabitModalOpen(true);
  };

  // Handler for editing a habit
  const handleEditHabit = (id: string) => {
    const habitToEdit = habits?.find((habit) => habit.id === id) || null;
    if (habitToEdit) {
      setCurrentHabit(habitToEdit);
      setHabitModalMode("edit");
      setIsHabitModalOpen(true);
    }
  };

  // Unified handler for submitting and updating habits
  const handleSubmitHabit = async (
    values: HabitGoalFormValues,
    habitId?: string
  ) => {
    if (habitModalMode === "edit" && habitId) {
      await updateHabit(habitId, values);
    } else {
      await addHabit(values);
    }

    setIsHabitModalOpen(false);
    setCurrentHabit(null);
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

      {/* Reset Goals Confirmation Modal (uses AnimatePresence correctly) */}
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

      {/* Delete Weight Goal Confirmation Modal (uses AnimatePresence correctly) */}
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

      {/* Unified Habit Modal - Wrap conditional render in AnimatePresence */}
      <AnimatePresence>
        {isHabitModalOpen && (
          <HabitModal
            key={
              habitModalMode === "edit" && currentHabit
                ? `habit-modal-edit-${currentHabit.id}`
                : "habit-modal-add"
            }
            isOpen={isHabitModalOpen} // Still needed by HabitModal internally
            onClose={handleCloseHabitModal}
            onSubmit={handleSubmitHabit}
            habit={currentHabit}
            mode={habitModalMode}
          />
        )}
      </AnimatePresence>

      {/* Weight Goal Modal - Wrap conditional render in AnimatePresence */}
      <AnimatePresence>
        {isWeightGoalModalOpen && (
          <WeightGoalModal
            key="weight-goal-modal" // Consistent key
            isOpen={isWeightGoalModalOpen} // Still needed by WeightGoalModal internally
            onClose={handleCloseWeightGoalModal}
            onSave={handleSaveGoal}
            currentWeight={user?.weight || 0}
            targetWeight={weightGoals?.targetWeight ?? user?.weight}
            tdee={nutritionProfile?.tdee || 0}
            weightGoals={weightGoals}
            isLoading={goalsLoading}
          />
        )}
      </AnimatePresence>

      <div className="relative min-h-screen pb-12 overflow-hidden">
        {/* Background effects - contained within parent with overflow-hidden */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none" />
        <div className="absolute top-40 -left-32 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-24 -right-32 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            {/* Left Section */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                Your Goals
              </h1>
              <p className="text-gray-400 max-w-2xl">
                Track your progress and stay motivated on your health journey
              </p>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Tab Navigation */}
              <div className="flex space-x-1 p-1 bg-gray-800/60 rounded-lg">
                <TabButton
                  active={activeTab === "active"}
                  onClick={() => setActiveTab("active")}
                >
                  <span className="flex items-center">
                    <GoalsIcon size="sm" className="mr-1.5" />
                    Active
                  </span>
                </TabButton>
                <TabButton
                  active={activeTab === "achieved"}
                  onClick={() => setActiveTab("achieved")}
                >
                  <span className="flex items-center">
                    <StarIcon size="sm" className="mr-1.5" />
                    Achievements
                  </span>
                </TabButton>{" "}
              </div>
            </div>
          </div>

          {/* Main Content Area with Animation for Tab Switching */}
          <div className="mt-8 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab} // Key change triggers animation
                initial={{ opacity: 0, y: 10 }} // Initial state (slightly below and faded out)
                animate={{ opacity: 1, y: 0 }} // Animate to fully visible and original position
                exit={{ opacity: 0, y: -10 }} // Exit state (slightly above and faded out)
                transition={{ duration: 0.2 }} // Animation duration
                // Removed absolute positioning to let content flow naturally
              >
                {activeTab === "active" ? (
                  <div className="space-y-6">
                    {/* Weight Goal Dashboard - Updated props */}
                    <WeightGoalDashboard
                      currentWeight={user?.weight || 0}
                      // Pass targetWeight from goals if available, otherwise from user (or 0)
                      targetWeight={weightGoals?.targetWeight ?? user?.weight}
                      tdee={nutritionProfile?.tdee || 0}
                      macroDailyTotals={
                        macroDailyTotals || {
                          protein: 0,
                          carbs: 0,
                          fats: 0,
                          calories: 0,
                        }
                      }
                      weightGoals={weightGoals}
                      isLoading={goalsLoading}
                      onOpenModal={handleOpenWeightGoalModal} // Pass modal opener
                      onDelete={handleOpenDeleteConfirmModal} // Pass delete confirm modal opener
                      targetCalories={
                        macroTarget?.macroTarget?.targetCalories ?? 0
                      }
                      macroTarget={macroTarget?.macroTarget ?? undefined}
                    />

                    {/* Habit Tracker - No changes needed here */}
                    <HabitTracker
                      habits={habits || []}
                      isLoading={habitsLoading}
                      onAddHabit={handleAddHabit}
                      onIncrementHabit={incrementHabitProgress}
                      onCompleteHabit={completeHabit}
                      onEditHabit={handleEditHabit}
                      onDeleteHabit={deleteHabit}
                    />

                    {/* Recent Stats Section - Keep as is for now */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        "Weekly Average",
                        "Monthly Trend",
                        "Progress Insights",
                      ].map((title, i) => (
                        <div
                          key={i}
                          className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 hover:bg-gray-800/60 transition-colors duration-200"
                        >
                          <h3 className="text-sm font-medium text-gray-300 mb-2">
                            {title}
                          </h3>
                          <p className="text-xs text-gray-400">Coming soon</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // AchievementsContent handles its own loading/empty states internally (or will)
                  <AchievementsContent />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
