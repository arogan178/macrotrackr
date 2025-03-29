import { WeightProgressCard, WeightDetailsCard, DailyGoalsCard } from "./";
import HabitGoalCard from "./HabitGoalCard";
import { WeightGoalFormValues } from "../types";
import { MacroDailyTotals } from "@/features/macroTracking/types";
import EmptyState from "@/components/EmptyState";
import { CardContainer } from "@/components/form";
import {
  PlusIcon,
  CalendarIcon,
  CheckIcon,
  CheckCircleIcon,
  BarChartIcon,
} from "@/components/Icons";

interface ActiveGoalsContentProps {
  userWeight?: number;
  targetWeight?: number;
  tdee: number;
  macroDailyTotals: MacroDailyTotals;
  weightGoals: any;
  onSaveGoal: (values: WeightGoalFormValues) => void;
}

function ActiveGoalsContent({
  userWeight = 0,
  targetWeight = 0,
  tdee = 0,
  macroDailyTotals,
  weightGoals,
  onSaveGoal,
}: ActiveGoalsContentProps) {
  return (
    <div className="space-y-8">
      {/* Top Row: Goal Management and Daily Targets (50/50 split) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeightProgressCard
          currentWeight={userWeight || 0}
          targetWeight={targetWeight || userWeight || 0}
          tdee={tdee}
          isLoading={false}
          onSave={onSaveGoal}
          className="h-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        />

        {/* Right Card: Daily Goals */}
        <DailyGoalsCard
          macroDailyTotals={macroDailyTotals}
          tdee={tdee}
          adjustedCalorieIntake={weightGoals?.adjustedCalorieIntake}
          userWeight={userWeight}
        />
      </div>

      {/* Middle Row: Goal Summary (only shown if weightGoals exists) */}
      {weightGoals ? (
        <WeightDetailsCard goalData={weightGoals} tdee={tdee} />
      ) : (
        <CardContainer className="w-full">
          <EmptyState
            title="No Weight Goal Set"
            message="Start by setting a weight goal to track your progress."
            action={{
              label: "Set a Goal",
              onClick: () => console.log("Implement set goal action"),
            }}
          />
        </CardContainer>
      )}

      {/* Bottom Row: Habit Goals */}
      <div>
        <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-purple-400" />
            Habit Goals
            <span className="ml-3 px-3 py-1 bg-green-600/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">
              Track daily habits
            </span>
          </div>
          <button className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            <PlusIcon className="w-4 h-4 mr-1" />
            Add New Habit
          </button>
        </h3>

        {/* Habit cards in side-by-side layout - Updated for better mobile handling */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Logging Streak Card */}
          <HabitGoalCard
            title="Logging streak"
            icon={<CalendarIcon />}
            current={7}
            target={30}
            progress={23}
            accentColor="indigo"
          />

          {/* Macro Goals Card */}
          <HabitGoalCard
            title="Macro goals hit"
            icon={<CheckIcon />}
            current={5}
            target={7}
            progress={71}
            accentColor="blue"
          />

          {/* Weekly Weigh-ins Card */}
          <HabitGoalCard
            title="Weekly weigh-ins"
            icon={<BarChartIcon />}
            current={4}
            target={4}
            progress={100}
            accentColor="green"
            isComplete={true}
          />
        </div>
      </div>
    </div>
  );
}

export default ActiveGoalsContent;
