import type { AggregatedDataPoint, NutritionAverage } from "../types";

interface NutritionInsightsProps {
  isLoading: boolean;
  dataProcessed: boolean;
  showNoDataMessage: boolean;
  aggregatedData: AggregatedDataPoint[];
  averages: NutritionAverage;
}

export default function NutritionInsights({
  isLoading,
  dataProcessed,
  showNoDataMessage,
  aggregatedData,
  averages,
}: NutritionInsightsProps) {
  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 shadow-xl">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">
        Nutrition Insights
      </h2>
      {isLoading || !dataProcessed ? (
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-gray-400">Loading insights...</p>
          </div>
        </div>
      ) : showNoDataMessage ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-400 text-center">
            No insights available due to lack of data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Consistency Analysis */}
          <div className="p-4 rounded-lg border border-indigo-500/20 bg-indigo-900/10">
            <h3 className="text-md font-medium text-indigo-300 mb-2">
              Consistency Analysis
            </h3>
            <p className="text-gray-300">
              {aggregatedData.filter((d) => d.calories > 0).length} out of{" "}
              {aggregatedData.length} days had tracked nutrition data.
              {aggregatedData.filter((d) => d.calories > 0).length /
                aggregatedData.length >=
              0.7
                ? " Great job maintaining consistency in your tracking!"
                : " Try to log your nutrition more consistently for better insights."}
            </p>
          </div>

          {/* Protein Intake */}
          <div className="p-4 rounded-lg border border-green-500/20 bg-green-900/10">
            <h3 className="text-md font-medium text-green-300 mb-2">
              Protein Intake
            </h3>
            <p className="text-gray-300">
              Your average daily protein intake is {averages.protein}g.
              {averages.protein === 0
                ? " No protein data tracked."
                : averages.protein >= 120
                  ? " You're doing great with protein intake!"
                  : " Consider increasing your protein intake for better muscle recovery and growth."}
            </p>
          </div>

          {/* Carbohydrate Patterns */}
          <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-900/10">
            <h3 className="text-md font-medium text-blue-300 mb-2">
              Carbohydrate Patterns
            </h3>
            <p className="text-gray-300">
              Your average daily carbohydrate intake is {averages.carbs}g.
              {averages.carbs === 0
                ? " No carbohydrate data tracked."
                : (() => {
                  const trackedCarbs = aggregatedData
                    .map((d) => d.carbs)
                    .filter((c) => c > 0);
                  if (trackedCarbs.length < 2)
                    return " Not enough data for pattern analysis.";
                  const variation =
                      Math.max(...trackedCarbs) - Math.min(...trackedCarbs);
                  return variation > 100
                    ? " Your carbohydrate intake varies significantly day to day. Consider more consistency for stable energy levels."
                    : " Your carbohydrate intake is relatively consistent, which helps maintain stable energy levels.";
                })()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
