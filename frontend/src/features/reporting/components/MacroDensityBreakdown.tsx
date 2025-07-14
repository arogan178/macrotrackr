import { motion } from "motion/react";
import { useEffect, useState } from "react";
// Custom tooltip component
import type { TooltipProps } from "recharts";
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
  startDate,
  endDate,
  groupBy,
  data: propertyData,
  selectedRange,
  isLoading: propertyIsLoading,
  dataProcessed,
}: MacroDensityBreakdownProps) => {
  // If data is not provided, use the macro density breakdown hook
  const data = propertyData || useMacroDensityBreakdown(undefined, "week");
  const loading =
    typeof propertyIsLoading === "boolean" ? propertyIsLoading : false;
  const error = undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-gray-800/70 rounded-xl border border-gray-700/30 p-3 shadow-lg flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-white">
          Macro Distribution
        </h3>
      </div>
      <div className="h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-400 text-sm">
              Loading macro distribution...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Array.isArray(data) ? data : []}
              stackOffset="expand"
              layout="vertical"
              margin={{ top: 15, right: 30, left: 0, bottom: 10 }}
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
                content={CustomTooltip}
                cursor={{ fill: "rgba(110,118,145,0.1)" }}
                wrapperStyle={{ outline: "none" }}
              />
              <Legend
                height={14}
                iconSize={10}
                iconType="circle"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 12, paddingTop: 2 }}
                payload={["protein", "carbs", "fats"].map((macro) => ({
                  id: macro,
                  value: macro.charAt(0).toUpperCase() + macro.slice(1),
                  type: "circle",
                  color: MACRO_COLORS[macro].base,
                }))}
                formatter={(value) => (
                  <span className="text-gray-300 capitalize ml-1">{value}</span>
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
      </div>
    </motion.div>
  );
};

interface CustomTooltipPayload {
  period: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return;
  const data = payload[0].payload as CustomTooltipPayload;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-md shadow-xl p-2 text-sm">
      <p className="font-medium text-white mb-1">{data.period}</p>
      <div className="space-y-0.5">
        <p className="text-green-400">
          <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2" />
          <span className="font-medium">
            {(data.protein * 100).toFixed(0)}%
          </span>
        </p>
        <p className="text-blue-400">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-2" />
          <span className="font-medium">{(data.carbs * 100).toFixed(0)}%</span>
        </p>
        <p className="text-red-400">
          <span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-2" />
          <span className="font-medium">{(data.fats * 100).toFixed(0)}%</span>
        </p>
      </div>
      <p className="text-gray-300 text-xs mt-1 pt-1 border-t border-gray-700">
        {Math.round(data.calories)} calories
      </p>
    </div>
  );
};

export default MacroDensityBreakdown;
