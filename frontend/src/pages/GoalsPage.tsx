import { useState, useEffect } from "react";
import { Navbar } from "@/features/layout/components";
import {
  WeightGoalCard,
  GoalSummaryCard,
  DailyGoalsCard,
  ProgressBar,
} from "@/features/goals/components";
import { WeightGoalFormValues } from "@/features/goals/types";
import { FloatingNotification } from "@/features/notifications/components";
import { TabButton } from "@/components/form";
import { useStore } from "@/store/store";
import { MacroDailyTotals } from "@/features/macroTracking/types";

export default function GoalsPage() {
  // State for tab navigation
  const [activeTab, setActiveTab] = useState<"active" | "achieved">("active");

  // Get state and actions from store
  const {
    user,
    userMetrics,
    weightGoals,
    macroDailyTotals, // Use the correct property name from the store
    isLoading,
    error,
    createWeightGoal,
    clearError,
    fetchUserDetails,
    fetchMacroData,
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
    createWeightGoal(formValues, userMetrics.tdee);
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

      <div className="relative min-h-screen pb-12">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none" />
        <div className="absolute top-40 -left-32 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-24 -right-32 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight">
                Goals & Progress
              </h1>
              <span className="ml-4 px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="text-gray-400 max-w-2xl">
              Track your fitness journey with personalized goals and insights.
              Set targets, monitor progress, and celebrate achievements.
            </p>
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="flex flex-wrap space-x-1 border-b border-gray-700/50 mb-8">
            <TabButton
              active={activeTab === "active"}
              onClick={() => setActiveTab("active")}
              className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
            >
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Active Goals
              </span>
            </TabButton>
            <TabButton
              active={activeTab === "achieved"}
              onClick={() => setActiveTab("achieved")}
              className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
            >
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Achievements
              </span>
            </TabButton>
          </div>

          {/* Main Content */}
          {isLoading ? (
            <GoalsLoadingSkeleton />
          ) : activeTab === "active" ? (
            <ActiveGoalsContent
              userWeight={user?.weight}
              targetWeight={weightGoals?.targetWeight}
              tdee={userMetrics?.tdee}
              macroDailyTotals={macroDailyTotals}
              weightGoals={weightGoals}
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

// Loading skeleton for goals page
function GoalsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gray-800/40 rounded-2xl h-64"></div>
        <div className="bg-gray-800/40 rounded-2xl h-64"></div>
      </div>

      <div className="h-6 bg-gray-700 rounded w-1/6 mb-4"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800/40 rounded-2xl h-32"></div>
        ))}
      </div>
    </div>
  );
}

// Active Goals Tab Content
function ActiveGoalsContent({
  userWeight = 0,
  targetWeight = 0,
  tdee = 0,
  macroDailyTotals,
  weightGoals,
  onSaveGoal,
}: {
  userWeight?: number;
  targetWeight?: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: any;
  onSaveGoal: (values: WeightGoalFormValues) => void;
}) {
  return (
    <div className="space-y-10">
      {/* Weight & Daily Goals Section - Enhanced layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Weight Goal Card */}
        <div className="lg:col-span-2">
          {weightGoals ? (
            <GoalSummaryCard goalData={weightGoals} tdee={tdee} />
          ) : (
            <WeightGoalCard
              currentWeight={userWeight || 0}
              targetWeight={targetWeight || userWeight || 0}
              tdee={tdee}
              isLoading={false}
              onSave={onSaveGoal}
              className="h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            />
          )}
        </div>

        {/* Daily Goals Card - Simplified */}
        <div className="lg:col-span-1">
          <DailyGoalsCard
            macroDailyTotals={macroDailyTotals}
            tdee={tdee}
            adjustedCalorieIntake={weightGoals?.adjustedCalorieIntake}
            userWeight={userWeight}
          />
        </div>
      </div>

      {/* Add Weight Goal Card if user has active goals */}
      {weightGoals && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Modify Goal
          </h3>
          <WeightGoalCard
            currentWeight={userWeight || 0}
            targetWeight={targetWeight || userWeight || 0}
            tdee={tdee}
            isLoading={false}
            onSave={onSaveGoal}
            className="transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          />
        </div>
      )}

      {/* Habit Goals Section - Enhanced styling */}
      <section>
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-200">Habit Goals</h2>
          <div className="ml-3 px-3 py-1 bg-green-600/10 border border-green-500/20 rounded-full">
            <span className="text-xs text-green-400 font-medium">
              Track daily habits
            </span>
          </div>
          <div className="ml-auto">
            <button className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New Habit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Logging Streak Card */}
          <HabitGoalCard
            title="Logging streak"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            }
            current={7}
            target={30}
            progress={23}
            accentColor="indigo"
          />

          {/* Macro Goals Card */}
          <HabitGoalCard
            title="Macro goals hit"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            }
            current={5}
            target={7}
            progress={71}
            accentColor="blue"
          />

          {/* Weekly Weigh-ins Card */}
          <HabitGoalCard
            title="Weekly weigh-ins"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            }
            current={4}
            target={4}
            progress={100}
            accentColor="green"
            isComplete={true}
          />
        </div>
      </section>
    </div>
  );
}

// Achievement Tab Content
function AchievementsContent() {
  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-b from-yellow-900/20 to-transparent p-8">
        <div className="flex items-center mb-8">
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-xl shadow-lg mr-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100 mb-1">
              Your Achievements
            </h2>
            <p className="text-gray-400 text-sm">
              Celebrate your health and fitness milestones
            </p>
          </div>
          <div className="ml-auto">
            <select className="bg-gray-700/50 text-gray-300 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>All Time</option>
              <option>This Year</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Achievement Card */}
          <div className="group bg-gray-700/30 border border-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-700/40 hover:border-gray-600/50 transition-all duration-300 shadow-md hover:shadow-lg">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 p-2.5 rounded-lg group-hover:from-yellow-500/30 group-hover:to-amber-600/30 transition-all duration-300">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="bg-gray-800/60 px-2.5 py-1 rounded-full">
                  <span className="text-xs text-gray-400">Feb 20, 2025</span>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2 text-gray-200 group-hover:text-white transition-colors">
                Lost first kilogram
              </h3>
              <div className="text-gray-400 text-sm mb-4">
                Taking the first step toward your weight goal
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-gray-400">Weight Loss</span>
                </div>
                <div className="flex items-center gap-1 bg-green-500/10 text-green-400 text-xs px-2.5 py-1 rounded-full">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Achieved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Empty state for additional achievements */}
          <div className="group bg-gray-700/20 border border-gray-700/30 border-dashed rounded-xl overflow-hidden hover:bg-gray-700/30 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-700/40 p-3 rounded-full mb-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              More achievements coming
            </h3>
            <p className="text-gray-500 text-xs">Keep up the good work!</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button className="px-5 py-2.5 bg-gray-700/60 border border-gray-600/50 rounded-lg text-gray-200 hover:bg-gray-700/80 transition-all duration-300 flex items-center gap-2 group">
            <span>View All Achievements</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Component for Habit Goal Cards - Fixed syntax errors
function HabitGoalCard({
  title,
  icon,
  current,
  target,
  progress,
  accentColor = "indigo",
  isComplete = false,
}: {
  title: string;
  icon: JSX.Element;
  current: number;
  target: number;
  progress: number;
  accentColor?: "indigo" | "blue" | "green";
  isComplete?: boolean;
}) {
  const colorClasses = {
    indigo: "from-indigo-900/20 to-transparent hover:bg-indigo-800/20",
    blue: "from-blue-900/20 to-transparent hover:bg-blue-800/20",
    green: "from-green-900/20 to-transparent hover:bg-green-800/20",
  };

  return (
    <div
      className={`bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
    >
      <div
        className={`bg-gradient-to-r ${colorClasses[accentColor]} p-5 h-full`}
      >
        <div className="flex justify-between items-start mb-5">
          <h3 className="font-medium text-gray-200">{title}</h3>
          <div className={`bg-${accentColor}-600/20 p-1.5 rounded-lg`}>
            <svg
              className={`w-4 h-4 text-${accentColor}-400`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {icon}
            </svg>
          </div>
        </div>

        <div className="flex items-end gap-1 mb-3">
          <span className="text-2xl font-bold text-gray-200">{current}</span>
          <span className="text-gray-400 text-sm">/ {target}</span>
          {isComplete ? (
            <span className="ml-auto text-sm text-green-400 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Complete
            </span>
          ) : (
            <span className="ml-auto text-sm text-gray-400">{progress}%</span>
          )}
        </div>

        <ProgressBar
          progress={progress}
          color={isComplete ? "green" : accentColor}
          height="sm"
        />
      </div>
    </div>
  );
}
