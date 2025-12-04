import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/chart";
import { StackedBarPercentageTooltip } from "@/components/chart/ChartTooltip";
import { MACRO_COLORS } from "@/utils/chartColors";

import { useMacroDensityBreakdown } from "../hooks/useMacroDensityBreakdown";

interface MacroDensityBreakdownProps {
  startDate?: string;
  endDate?: string;
  groupBy?: "week" | "month";
  data?: any[];
  selectedRange?: number;
  isLoading?: boolean;
  dataProcessed?: boolean;
}

// --- Subcomponents ---

interface PercentageLabelProps {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  height?: string | number;
  value?: string | number;
}

const PercentageLabel = (properties: PercentageLabelProps) => {
  // Convert to number if possible, else default to 0
  const toNumber = (value_: string | number | undefined) =>
    typeof value_ === "number" ? value_ : value_ ? Number(value_) : 0;
  const x = toNumber(properties.x);
  const y = toNumber(properties.y);
  const width = toNumber(properties.width);
  const height = toNumber(properties.height);
  const value =
    typeof properties.value === "number"
      ? properties.value
      : properties.value
        ? Number(properties.value)
        : 0;
  // Only show label if value is significant enough to fit
  if (value < 0.05 || width < 20) return;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="#ffffff"
      fontSize={12}
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight={600}
    >
      {`${(value * 100).toFixed(0)}%`}
    </text>
  );
};

const MacroDensityBreakdown = ({
  startDate: _startDate,
  endDate: _endDate,
  groupBy: _groupBy,
  data: propertyData,
  selectedRange: _selectedRange,
  isLoading: propertyIsLoading,
  dataProcessed,
}: MacroDensityBreakdownProps) => {
  // Always call hook, then prefer provided data if present
  const hookData = useMacroDensityBreakdown(undefined, "week");
  const data = propertyData ?? hookData;
  const loading =
    typeof propertyIsLoading === "boolean" ? propertyIsLoading : false;
  // Show a message if there is no data after loading
  const showNoData =
    !loading && Array.isArray(data) && data.length === 0 && dataProcessed;

  return (
    <ChartCard title="Macro Distribution" className="h-100">
      {loading || showNoData ? (
        <div className="flex h-full items-center justify-center">
          {loading ? (
            <div className="animate-pulse text-sm text-muted">
              Loading macro distribution...
            </div>
          ) : (
            <div className="text-sm text-muted">
              No macro data available for this period.
            </div>
          )}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={Array.isArray(data) ? data : []}
            stackOffset="expand"
            layout="vertical"
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            barSize={25}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.1}
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
              domain={[0, 1]}
              hide={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
            />
            <YAxis
              dataKey="period"
              type="category"
              tick={{ fill: "#d1d5db", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              // Use standardized stacked bar tooltip with color mapping and macro dots
              content={
                ((properties: any) => (
                  <StackedBarPercentageTooltip
                    {...properties}
                    colors={{
                      protein: MACRO_COLORS.protein.base,
                      carbs: MACRO_COLORS.carbs.base,
                      fats: MACRO_COLORS.fats.base,
                    }}
                    labelKey="period"
                  />
                )) as unknown as any
              }
              cursor={{ fill: "rgba(110,118,145,0.1)" }}
              wrapperStyle={{ outline: "none" }}
            />
            <Legend
              height={14}
              iconSize={10}
              iconType="circle"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: 12, paddingTop: 2 }}
              payload={["protein", "carbs", "fats"].map((macro) => ({
                id: macro,
                value: macro.charAt(0).toUpperCase() + macro.slice(1),
                type: "circle",
                color: MACRO_COLORS[macro].base,
              }))}
              formatter={(value) => (
                <span className="ml-1 text-foreground capitalize">{value}</span>
              )}
            />
            <Bar
              dataKey="protein"
              stackId="1"
              fill={MACRO_COLORS.protein.gradient[0]}
              radius={[20, 0, 0, 20]}
            >
              <LabelList dataKey="protein" content={PercentageLabel} />
            </Bar>
            <Bar
              dataKey="carbs"
              stackId="1"
              fill={MACRO_COLORS.carbs.gradient[0]}
              radius={[0, 0, 0, 0]}
            >
              <LabelList dataKey="carbs" content={PercentageLabel} />
            </Bar>
            <Bar
              dataKey="fats"
              stackId="1"
              fill={MACRO_COLORS.fats.gradient[0]}
              radius={[0, 20, 20, 0]}
            >
              <LabelList dataKey="fats" content={PercentageLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};

export default MacroDensityBreakdown;
