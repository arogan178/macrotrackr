import { useState, useEffect } from "react";
import { Navbar } from "@/features/layout/components";
import {
  GoalsLoadingSkeleton,
  AchievementsContent,
  WeightGoalDashboard,
  HabitTracker,
  HabitModal, // Using the unified HabitModal
} from "@/features/goals/components";
import {
  WeightGoalFormValues,
  HabitGoalFormValues,
  HabitGoal,
} from "@/features/goals/types";
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
  // State for the habit being edited
  const [currentHabit, setCurrentHabit] = useState<HabitGoal | null>(null);
  // State for modal mode (add or edit)
  const [habitModalMode, setHabitModalMode] = useState<"add" | "edit">("add");

  // Get state and actions from store
  const {
    user,
    nutritionProfile,
    weightGoals,
    macroTarget,
    macroDailyTotals,
    habitGoals,
    isLoading,
    isLoadingHabits,
    error,
    habitError,
    createWeightGoal,
    clearError,
    clearHabitError,
    fetchUserDetails,
    fetchMacroData,
    fetchWeightGoals,
    fetchMacroTarget,
    fetchHabitGoals,
    addHabitGoal,
    updateHabitGoal,
    incrementHabitProgress,
    completeHabitGoal,
    deleteHabitGoal,
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
    fetchHabitGoals();
  }, [
    user,
    fetchUserDetails,
    fetchMacroData,
    fetchWeightGoals,
    fetchMacroTarget,
    fetchHabitGoals,
  ]);

  // Handler for saving weight goal
  const handleSaveGoal = (formValues: WeightGoalFormValues) => {
    if (!nutritionProfile?.tdee) return;

    // Pass all the calculated values directly to the createWeightGoal function
    createWeightGoal(formValues, nutritionProfile.tdee);
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
    const habitToEdit = habitGoals?.find((habit) => habit.id === id) || null;
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
      await updateHabitGoal(habitId, values);
    } else {
      await addHabitGoal(values);
    }

    setIsHabitModalOpen(false);
    setCurrentHabit(null);
  };

  // Handler for closing the habit modal
  const handleCloseHabitModal = () => {
    setIsHabitModalOpen(false);
    setCurrentHabit(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />

      {/* Show notifications for errors */}
      {error && (
        <FloatingNotification
          message={error}
          type="error"
          onClose={clearError}
          duration={5000}
        />
      )}

      {habitError && (
        <FloatingNotification
          message={habitError}
          type="error"
          onClose={clearHabitError}
          duration={5000}
        />
      )}

      {/* Reset Goals Confirmation Modal */}
      <Modal
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

      {/* Unified Habit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={handleCloseHabitModal}
        onSubmit={handleSubmitHabit}
        habit={currentHabit}
        mode={habitModalMode}
      />

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
                </TabButton>
              </div>

              {/* Action Button */}
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200 flex items-center"
                onClick={() => setIsResetModalOpen(true)}
              >
                <PlusIcon size="sm" className="mr-1.5" />
                <span className="hidden sm:inline">Create New Goal</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          {isLoading ? (
            <GoalsLoadingSkeleton />
          ) : activeTab === "active" ? (
            <div className="space-y-6">
              {/* Weight Goal Dashboard */}
              <WeightGoalDashboard
                currentWeight={user?.weight || 0}
                targetWeight={weightGoals?.targetWeight || user?.weight || 0}
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
                onSave={handleSaveGoal}
                isLoading={isLoading}
                targetCalories={macroTarget?.targetCalories}
                macroTarget={macroTarget?.macroTarget}
              />

              {/* Habit Tracker - Now with edit functionality */}
              <HabitTracker
                habits={habitGoals || []}
                isLoading={isLoadingHabits}
                onAddHabit={handleAddHabit}
                onIncrementHabit={incrementHabitProgress}
                onCompleteHabit={completeHabitGoal}
                onEditHabit={handleEditHabit}
                onDeleteHabit={deleteHabitGoal}
              />

              {/* Recent Stats Section - Optional feature to show additional metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Weekly Average", "Monthly Trend", "Progress Insights"].map(
                  (title, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 hover:bg-gray-800/60 transition-colors duration-200"
                    >
                      <h3 className="text-sm font-medium text-gray-300 mb-2">
                        {title}
                      </h3>
                      <p className="text-xs text-gray-400">Coming soon</p>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <AchievementsContent />
          )}
        </div>
      </div>
    </div>
  );
}
