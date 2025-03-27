import { CardContainer } from "@/components/form";
import { EditIcon, CalorieIcon, GoalsIcon } from "@/components/Icons";
import ProgressBar from "./ProgressBar";
import { MacroDailyTotals } from "@/features/macroTracking/types";

interface DailyGoalsCardProps {
  macroDailyTotals?: MacroDailyTotals;
  tdee: number;
  adjustedCalorieIntake?: number;
  userWeight?: number;
}

export default function DailyGoalsCard({
  macroDailyTotals,
  tdee,
  adjustedCalorieIntake,
  userWeight = 70,
}: DailyGoalsCardProps) {
  const targetCalories = adjustedCalorieIntake || tdee;

  // Add validation to ensure all required properties exist
  const safeTotal = macroDailyTotals || {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
      <div className="bg-gradient-to-r from-indigo-900/30 to-transparent p-6 h-full">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-200">Daily Goals</h2>
          <div className="ml-auto bg-indigo-500/20 p-1.5 rounded-full">
            <svg
              className="w-4 h-4 text-indigo-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>

        {/* Calories Section */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <CalorieIcon className="w-4 h-4 text-indigo-400" />
              <span className="font-medium text-gray-200">Calories</span>
            </div>
            <div className="text-sm text-gray-400">
              {Math.round((safeTotal.calories / targetCalories) * 100)}% of goal
            </div>
          </div>

          <div className="flex justify-between items-center mb-2 text-2xl font-bold">
            <span className="text-gray-200">
              {Math.round(safeTotal.calories)}
            </span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">{Math.round(targetCalories)}</span>
          </div>

          <ProgressBar
            progress={Math.min(
              Math.round((safeTotal.calories / targetCalories) * 100),
              100
            )}
            color="indigo"
            height="md"
          />
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {/* Protein Card */}
          <MacroCard
            label="Protein"
            current={safeTotal.protein}
            target={Math.round(userWeight * 2)}
            color="green"
            unit="g"
          />

          {/* Carbs Card */}
          <MacroCard
            label="Carbs"
            current={safeTotal.carbs}
            target={Math.round((targetCalories * 0.5) / 4)}
            color="blue"
            unit="g"
          />

          {/* Fats Card */}
          <MacroCard
            label="Fats"
            current={safeTotal.fats}
            target={Math.round((targetCalories * 0.25) / 9)}
            color="red"
            unit="g"
          />
        </div>
      </div>
    </div>
  );
}

// Helper component for macro tracking
function MacroCard({
  label,
  current,
  target,
  color,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  color: "red" | "blue" | "green";
  unit: string;
}) {
  const progress = Math.min(Math.round((current / target) * 100), 100);
  const colorClasses = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
  };

  return (
    <div className="bg-gray-700/30 p-3 rounded-lg hover:bg-gray-700/40 transition-colors duration-200">
      <div className="flex justify-center mb-1">
        <span className={`w-2.5 h-2.5 rounded-full ${colorClasses[color]}`} />
      </div>
      <div className="text-sm mb-1 text-gray-300">{label}</div>
      <div className="text-lg font-semibold text-gray-200">
        {Math.round(current)}/{target}
        <span className="text-xs ml-0.5">{unit}</span>
      </div>
      <ProgressBar progress={progress} color={color} height="sm" />
    </div>
  );
}
