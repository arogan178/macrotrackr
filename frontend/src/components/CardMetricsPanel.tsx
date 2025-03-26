import { memo } from "react";
import { UserIcon, StarIcon } from "./Icons";

interface MetricsPanelProps {
  bmr: number;
  tdee: number;
  isLoading?: boolean;
}

function CardMetricsPanel({ bmr, tdee, isLoading = false }: MetricsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl animate-pulse"
          >
            <div className="flex items-start gap-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/20">
                <div className="h-7 w-7 bg-gray-700 rounded"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-7 bg-gray-700 rounded w-2/5"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* BMR Panel */}
      <div className="bg-gray-800/70 backdrop-blur-sm p-3.5 rounded-2xl border border-gray-700/50 shadow-xl hover:bg-gray-800/80 transition-colors group">
        <div className="flex items-start gap-5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/20">
            <UserIcon
              className="h-7 w-7 text-indigo-400 transform group-hover:scale-110 transition-transform"
              strokeWidth={1.5}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-medium text-gray-400 text-sm truncate">
                Basal Metabolic Rate
              </h3>
              <span className="text-xs text-indigo-400/80 whitespace-nowrap">
                (BMR)
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {bmr ? (
                <span className="bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
                  {bmr} <span className="text-lg font-medium">kcal</span>
                </span>
              ) : (
                <span className="text-gray-500 text-lg">Complete profile</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* TDEE Panel */}
      <div className="bg-gray-800/70 backdrop-blur-sm p-3.5 rounded-2xl border border-gray-700/50 shadow-xl hover:bg-gray-800/80 transition-colors group">
        <div className="flex items-start gap-5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20">
            <StarIcon
              className="h-7 w-7 text-blue-400 transform group-hover:scale-110 transition-transform"
              strokeWidth={1.5}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-medium text-gray-400 text-sm truncate">
                Total Daily Energy
              </h3>
              <span className="text-xs text-blue-400/80 whitespace-nowrap">
                (TDEE)
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {tdee ? (
                <span className="bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
                  {tdee} <span className="text-lg font-medium">kcal</span>
                </span>
              ) : (
                <span className="text-gray-500 text-lg">Complete profile</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(CardMetricsPanel);
