import { useMemo, useState } from "react";
import { Flame, PieChart } from "lucide-react";

import { ChartCard, LineChartComponent } from "@/components/chart";
import type { ChartDataPoint } from "@/components/chart/Types";
import TabBar from "@/components/ui/TabBar";
import type { LineConfig } from "@/components/chart/Types";

interface TrendsChartSectionProps {
  dailySeries: ChartDataPoint[];
  isHistoryLoading: boolean;
  dataProcessed: boolean;
  calorieChartLines: LineConfig[];
  macroChartLines: LineConfig[];
}

export default function TrendsChartSection({
  dailySeries,
  isHistoryLoading,
  dataProcessed,
  calorieChartLines,
  macroChartLines,
}: TrendsChartSectionProps) {
  const [activeTab, setActiveTab] = useState<"calories" | "macros">("calories");
  
  const chartShowNoDataMessage = !isHistoryLoading && dataProcessed && dailySeries.length === 0;

  const tabItems = useMemo(
    () => [
      { 
        key: "calories", 
        label: (
          <div className="flex items-center gap-1.5 px-1">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>Calories</span>
          </div>
        )
      },
      { 
        key: "macros", 
        label: (
          <div className="flex items-center gap-1.5 px-1">
            <PieChart className="h-3.5 w-3.5 text-blue-500" />
            <span>Macros</span>
          </div>
        )
      },
    ],
    []
  );

  return (
    <ChartCard
      title="Intake Trends"
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
      <LineChartComponent
        data={dailySeries}
        lines={activeTab === "calories" ? calorieChartLines : macroChartLines}
        isLoading={isHistoryLoading || !dataProcessed}
        showNoDataMessage={chartShowNoDataMessage}
        height={320}
      />
    </ChartCard>
  );
}
