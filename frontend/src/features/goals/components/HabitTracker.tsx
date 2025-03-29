import { ReactNode } from "react";
import ProgressBar from "../../../components/ProgressBar";

interface HabitGoalProps {
  id: number;
  title: string;
  icon: ReactNode;
  current: number;
  target: number;
  progress: number;
  accentColor?: "indigo" | "blue" | "green" | "purple";
  isComplete?: boolean;
}

interface HabitTrackerProps {
  habits: HabitGoalProps[];
  onAddHabit?: () => void;
}

function HabitTracker({ habits, onAddHabit }: HabitTrackerProps) {
  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden">
      <div className="p-5">
        {/* Header with title and add button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-200 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Habit Goals
          </h3>

          {onAddHabit && (
            <button
              onClick={onAddHabit}
              className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg"
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Habit
            </button>
          )}
        </div>

        {habits.length === 0 ? (
          <div className="bg-gray-700/30 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-3">No habit goals set yet</p>
            {onAddHabit && (
              <button
                onClick={onAddHabit}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                Add your first habit goal
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <HabitCard key={habit.id} {...habit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HabitCard({
  title,
  icon,
  current,
  target,
  progress,
  accentColor = "indigo",
  isComplete = false,
}: Omit<HabitGoalProps, "id">) {
  const getGradientClass = (color: string) => {
    const gradients = {
      indigo: "from-indigo-500/20 to-indigo-500/5",
      blue: "from-blue-500/20 to-blue-500/5",
      green: "from-green-500/20 to-green-500/5",
      purple: "from-purple-500/20 to-purple-500/5",
    };
    return gradients[color as keyof typeof gradients] || gradients.indigo;
  };

  const getAccentClass = (color: string) => {
    const colors = {
      indigo: "text-indigo-400 bg-indigo-400/10",
      blue: "text-blue-400 bg-blue-400/10",
      green: "text-green-400 bg-green-400/10",
      purple: "text-purple-400 bg-purple-400/10",
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  return (
    <div className="bg-gray-700/30 rounded-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${getGradientClass(accentColor)} p-3`}>
        <div className="flex items-center mb-2">
          <div
            className={`p-1.5 rounded-lg ${getAccentClass(accentColor)} mr-2`}
          >
            {icon}
          </div>
          <h4 className="font-medium text-gray-200">{title}</h4>

          {isComplete && (
            <span className="ml-auto text-xs text-green-400 flex items-center gap-1 bg-green-400/10 px-2 py-0.5 rounded-full">
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
          )}
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-200">{current}</span>
            <span className="text-gray-400 text-sm">/ {target}</span>
          </div>

          {!isComplete && (
            <span className="text-sm text-gray-400">{progress}%</span>
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

export default HabitTracker;
