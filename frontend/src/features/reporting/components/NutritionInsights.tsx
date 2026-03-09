import {
  BarChartIcon,
  CheckCircleIcon,
  LightningIcon,
  ProteinIcon,
} from "@/components/ui";

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
  const trackedDays = aggregatedData.filter((d) => d.calories > 0).length;
  const totalDays = aggregatedData.length;
  const consistencyRate = totalDays > 0 ? trackedDays / totalDays : 0;
  const isConsistent = consistencyRate >= 0.7;

  const getProteinInsight = () => {
    if (averages.protein === 0)
      return { status: "neutral", message: "No protein data tracked yet." };
    if (averages.protein >= 120)
      return {
        status: "good",
        message: "Excellent protein intake for muscle recovery!",
      };
    if (averages.protein >= 80)
      return {
        status: "moderate",
        message: "Good start! Consider aiming for 1.6g per kg of body weight.",
      };
    return {
      status: "low",
      message: "Increasing protein can support muscle growth and satiety.",
    };
  };

  const getCarbInsight = () => {
    if (averages.carbs === 0)
      return {
        status: "neutral",
        message: "No carbohydrate data tracked yet.",
      };
    const trackedCarbs = aggregatedData
      .map((d) => d.carbs)
      .filter((c) => c > 0);
    if (trackedCarbs.length < 2)
      return {
        status: "neutral",
        message: "Not enough data for pattern analysis.",
      };
    const variation = Math.max(...trackedCarbs) - Math.min(...trackedCarbs);
    if (variation > 100)
      return {
        status: "variable",
        message:
          "High day-to-day variation. Consider more consistency for stable energy.",
      };
    return {
      status: "stable",
      message: "Consistent intake helps maintain stable energy levels.",
    };
  };

  const proteinInsight = getProteinInsight();
  const carbInsight = getCarbInsight();

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-5 text-lg font-semibold text-foreground">
        Nutrition Insights
      </h2>

      {isLoading || !dataProcessed ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted">Analyzing your nutrition...</p>
          </div>
        </div>
      ) : showNoDataMessage ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2">
          <BarChartIcon className="h-10 w-10 text-muted" />
          <p className="text-center text-muted">
            Start logging meals to see insights here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Consistency Card */}
          <div className="rounded-xl border border-border bg-surface-2 p-4 transition-colors duration-200 hover:border-white/20">
            <div className="mb-3 flex items-center gap-2">
              <div
                className={`rounded-xl p-2 ${isConsistent ? "bg-primary/10" : "bg-surface-3"}`}
              >
                <CheckCircleIcon
                  className={`h-4 w-4 ${isConsistent ? "text-primary" : "text-muted"}`}
                />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                Consistency
              </h3>
            </div>
            <p className="mb-2 text-2xl font-bold text-foreground">
              {trackedDays}
              <span className="text-base font-normal text-muted">
                /{totalDays} days
              </span>
            </p>
            <p className="text-sm text-muted">
              {isConsistent
                ? "Great job maintaining your tracking habit!"
                : "Try to log more consistently for better insights."}
            </p>
          </div>

          {/* Protein Card */}
          <div className="rounded-xl border border-border bg-surface-2 p-4 transition-colors duration-200 hover:border-white/20">
            <div className="mb-3 flex items-center gap-2">
              <div
                className={`rounded-xl p-2 ${proteinInsight.status === "good" ? "bg-success/10" : "bg-surface-3"}`}
              >
                <ProteinIcon
                  className={`h-4 w-4 ${proteinInsight.status === "good" ? "text-success" : "text-muted"}`}
                />
              </div>
              <h3 className="text-sm font-medium text-foreground">Protein</h3>
            </div>
            <p className="mb-2 text-2xl font-bold text-foreground">
              {Math.round(averages.protein)}
              <span className="text-base font-normal text-muted">g avg</span>
            </p>
            <p className="text-sm text-muted">{proteinInsight.message}</p>
          </div>

          {/* Carbs Card */}
          <div className="rounded-xl border border-border bg-surface-2 p-4 transition-colors duration-200 hover:border-white/20">
            <div className="mb-3 flex items-center gap-2">
              <div
                className={`rounded-xl p-2 ${carbInsight.status === "stable" ? "bg-primary/10" : "bg-surface-3"}`}
              >
                <LightningIcon
                  className={`h-4 w-4 ${carbInsight.status === "stable" ? "text-primary" : "text-muted"}`}
                />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                Carbohydrates
              </h3>
            </div>
            <p className="mb-2 text-2xl font-bold text-foreground">
              {Math.round(averages.carbs)}
              <span className="text-base font-normal text-muted">g avg</span>
            </p>
            <p className="text-sm text-muted">{carbInsight.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
