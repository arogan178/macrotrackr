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
    <div className="rounded-xl border border-border/50 bg-surface p-4 shadow-modal backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Nutrition Insights
      </h2>
      {isLoading || !dataProcessed ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
            <p className="text-foreground">Loading insights...</p>
          </div>
        </div>
      ) : showNoDataMessage ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-center text-foreground">
            No insights available due to lack of data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Consistency Analysis */}
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <h3 className="text-md mb-2 font-medium text-primary">
              Consistency Analysis
            </h3>
            <p className="text-foreground">
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
          <div className="rounded-lg border border-green-500/20 bg-success/10 p-4">
            <h3 className="text-md mb-2 font-medium text-success">
              Protein Intake
            </h3>
            <p className="text-foreground">
              Your average daily protein intake is {averages.protein}g.
              {averages.protein === 0
                ? " No protein data tracked."
                : averages.protein >= 120
                  ? " You're doing great with protein intake!"
                  : " Consider increasing your protein intake for better muscle recovery and growth."}
            </p>
          </div>

          {/* Carbohydrate Patterns */}
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <h3 className="text-md mb-2 font-medium text-primary">
              Carbohydrate Patterns
            </h3>
            <p className="text-foreground">
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
