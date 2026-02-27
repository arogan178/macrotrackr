import { useMemo, useState } from "react";

import { ChartCard, LineChartComponent } from "@/components/chart";
import TabBar from "@/components/ui/TabBar";

interface TrendsChartSectionProps {
  dailySeries: any[];
  isHistoryLoading: boolean;
  dataProcessed: boolean;
  calorieChartLines: any[];
  macroChartLines: any[];
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
      { key: "calories", label: "Calories" },
      { key: "macros", label: "Macros" },
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
