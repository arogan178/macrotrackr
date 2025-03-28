import { useState, useEffect } from "react";
import { Navbar } from "@/features/layout/components";
import {
  GoalsLoadingSkeleton,
  ActiveGoalsContent,
  AchievementsContent,
} from "@/features/goals/components";
import { WeightGoalFormValues } from "@/features/goals/types";
import { FloatingNotification } from "@/features/notifications/components";
import { TabButton } from "@/components/form";
import { useStore } from "@/store/store";
import { GoalsIcon, StarIcon, PlusIcon } from "@/components/Icons";
import Modal from "@/components/Modal";

export default function GoalsPage() {
  // State for tab navigation
  const [activeTab, setActiveTab] = useState<"active" | "achieved">("active");
  // State for reset goals modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Get state and actions from store
  const {
    user,
    userMetrics,
    weightGoals,
    macroDailyTotals,
    isLoading,
    error,
    createWeightGoal,
    clearError,
    fetchUserDetails,
    fetchMacroData,
    resetGoals,
  } = useStore();

  // Fetch user details and macros on component mount if needed
  useEffect(() => {
    if (!user) {
      fetchUserDetails();
    }
    fetchMacroData();
  }, [user, fetchUserDetails, fetchMacroData]);

  // Handler for saving weight goal
  const handleSaveGoal = (formValues: WeightGoalFormValues) => {
    if (!userMetrics?.tdee) return;

    // Add today's date as the starting date
    const today = new Date().toISOString().split("T")[0];

    // Pass all form values including adjustedCalorieIntake if provided
    createWeightGoal(
      {
        ...formValues,
        startDate: today,
      },
      userMetrics.tdee
    );
  };

  // Handler for resetting goals
  const handleResetGoals = () => {
    resetGoals();
    setIsResetModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />

      {error && (
        <FloatingNotification
          message={error}
          type="error"
          onClose={clearError}
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

      <div className="relative min-h-screen pb-12 overflow-hidden">
        {/* Background effects - contained within parent with overflow-hidden */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none" />
        <div className="absolute top-40 -left-32 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-24 -right-32 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Page Header - Updated with left/right sections */}
          <div className="flex justify-between items-start mb-8">
            {/* Left Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Your Goals
                </h1>
                <p className="text-gray-400 max-w-2xl">
                  Track your progress and stay motivated
                </p>
              </div>

              {/* Tab Navigation moved into left section */}
              <div className="flex flex-wrap space-x-1">
                <TabButton
                  active={activeTab === "active"}
                  onClick={() => setActiveTab("active")}
                >
                  <span className="flex items-center">
                    <GoalsIcon
                      size="sm"
                      className={`mr-2 ${
                        activeTab === "active" ? "text-white" : "text-gray-400"
                      }`}
                    />
                    Active Goals
                  </span>
                </TabButton>
                <TabButton
                  active={activeTab === "achieved"}
                  onClick={() => setActiveTab("achieved")}
                >
                  <span className="flex items-center">
                    <StarIcon
                      size="sm"
                      className={`mr-2 ${
                        activeTab === "achieved"
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    />
                    Achievements
                  </span>
                </TabButton>
              </div>
            </div>

            {/* Right Section */}
            <div>
              <button
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors duration-200 flex items-center"
                onClick={() => setIsResetModalOpen(true)}
              >
                Create New Goals
                <PlusIcon size="sm" className="ml-2" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          {isLoading ? (
            <GoalsLoadingSkeleton />
          ) : activeTab === "active" ? (
            <ActiveGoalsContent
              userWeight={user?.weight}
              targetWeight={weightGoals?.targetWeight}
              tdee={userMetrics?.tdee || 0}
              macroDailyTotals={
                macroDailyTotals || {
                  protein: 0,
                  carbs: 0,
                  fats: 0,
                  calories: 0,
                }
              }
              weightGoals={weightGoals || null}
              onSaveGoal={handleSaveGoal}
            />
          ) : (
            <AchievementsContent />
          )}
        </div>
      </div>
    </div>
  );
}
