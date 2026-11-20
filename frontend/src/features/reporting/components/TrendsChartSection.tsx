import { useMemo, useState } from "react";

import ChartCard from "@/components/chart/ChartCard";
import type { ChartDataPoint, LineConfig } from "@/components/chart/ChartTypes";
import LineChartComponent from "@/components/chart/LineChartComponent";
import { CalorieIcon, PieChartIcon } from "@/components/ui";
import TabBar from "@/components/ui/TabBar";

interface TrendsChartSectionProps {
  dailySeries: ChartDataPoint[];
  isHistoryLoading: boolean;
  isHistoryReady: boolean;
  calorieChartLines: LineConfig[];
  macroChartLines: LineConfig[];
}

export default function TrendsChartSection({
  dailySeries,
  isHistoryLoading,
  isHistoryReady,
  calorieChartLines,
  macroChartLines,
}: TrendsChartSectionProps) {
  const [activeTab, setActiveTab] = useState<"calories" | "macros">("calories");

  const chartShowNoDataMessage =
    !isHistoryLoading && isHistoryReady && dailySeries.length === 0;

  // Plot unlogged days as gaps instead of misleading zero-calorie cliffs.
  const chartData = useMemo(
    () =>
      dailySeries.map((day) => {
        const calories = Number(day.calories ?? 0);
        const protein = Number(day.protein ?? 0);
        const carbs = Number(day.carbs ?? 0);
        const fats = Number(day.fats ?? 0);
        const isUnlogged =
          day.hasEntries !== undefined
            ? !day.hasEntries
            : calories === 0 && protein === 0 && carbs === 0 && fats === 0;
        if (!isUnlogged) return day;

        return {
          ...day,
          calories: null,
          protein: null,
          carbs: null,
          fats: null,
        };
      }),
    [dailySeries],
  );

  const tabItems = useMemo(
    () => [
      {
        key: "calories",
        label: (
          <div className="flex items-center gap-1.5 px-1">
            <CalorieIcon className="h-3.5 w-3.5 text-warning" />
            <span>Calories</span>
          </div>
        ),
      },
      {
        key: "macros",
        label: (
          <div className="flex items-center gap-1.5 px-1">
            <PieChartIcon className="h-3.5 w-3.5 text-muted" />
            <span>Macros</span>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <ChartCard
      title="Intake trends"
      className="w-full"
      minHeight={320}
      action={
        <TabBar
          items={tabItems}
          activeKey={activeTab}
          onChange={(value) => setActiveTab(value as "calories" | "macros")}
          size="sm"
          isMotion
          layoutId="trends-chart-tab"
        />
      }
    >
      {/* Fills whatever height the card is given, so beside the summary the
          axis sits on the panel's foot rather than above an empty band. */}
      <div className="absolute inset-0">
        <LineChartComponent
          data={chartData}
          lines={activeTab === "calories" ? calorieChartLines : macroChartLines}
          showLegend={activeTab !== "calories"}
          isLoading={isHistoryLoading || !isHistoryReady}
          showNoDataMessage={chartShowNoDataMessage}
        />
      </div>
    </ChartCard>
  );
}
