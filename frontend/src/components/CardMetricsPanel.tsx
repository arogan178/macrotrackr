import { memo } from "react";

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
          <div key={i} className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl animate-pulse">
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
      <div className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl hover:bg-gray-800/80 transition-colors group">
        <div className="flex items-start gap-5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/20">
            <svg className="h-7 w-7 text-indigo-400 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-medium text-gray-400 text-sm truncate">Basal Metabolic Rate</h3>
              <span className="text-xs text-indigo-400/80 whitespace-nowrap">(BMR)</span>
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
      <div className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl hover:bg-gray-800/80 transition-colors group">
        <div className="flex items-start gap-5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20">
            <svg className="h-7 w-7 text-blue-400 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.519-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.381-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-medium text-gray-400 text-sm truncate">Total Daily Energy</h3>
              <span className="text-xs text-blue-400/80 whitespace-nowrap">(TDEE)</span>
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
