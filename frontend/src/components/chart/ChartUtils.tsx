import React from "react";
import { TooltipProps } from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

/**
 * Create a linear gradient definition for a chart
 */
export function createGradient(
  id: string,
  colors: [string, string],
  horizontal: boolean = false
) {
  return (
    <linearGradient
      key={`color-${id}`}
      id={`color-${id}`}
      x1={horizontal ? "0" : "1"}
      y1={horizontal ? "1" : "0"}
      x2={horizontal ? "1" : "0"}
      y2={horizontal ? "0" : "0"}
    >
      <stop offset="0%" stopColor={colors[0]} stopOpacity={0.8} />
      <stop offset="100%" stopColor={colors[1]} stopOpacity={0.8} />
    </linearGradient>
  );
}

/**
 * Recharts Legend formatter
 */
export const legendFormatter = (value: string) => (
  <span className="text-gray-300 capitalize ml-1">{value}</span>
);

/**
 * Standard legend configuration
 */
export const standardLegendConfig = {
  iconType: "circle" as const,
  iconSize: 10,
  verticalAlign: "bottom" as const,
  align: "center" as const,
  height: 14,
  wrapperStyle: {
    fontSize: 12,
    paddingTop: 2,
  },
};

/**
 * Generate percentage label component
 */
interface PercentageLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  textColor?: string;
}

export const PercentageLabel = React.memo((props: PercentageLabelProps) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    value = 0,
    textColor = "#ffffff",
  } = props;

  // Only show label if value is significant enough to fit
  if (value < 5 || width < 20) return null;

  return (
    <text
      x={x + width - 10}
      y={y + height / 2}
      fill={textColor}
      fontSize={12}
      fontWeight="bold"
      textAnchor="end"
      dominantBaseline="central"
      style={{ opacity: value > 0 ? 0.92 : 0 }}
    >
      {`${value}%`}
    </text>
  );
});

/**
 * Centralized gradient color schemes
 */
export const COLOR_SCHEMES = {
  macro: {
    protein: {
      base: "#34d399", // green-400
      gradient: ["#10b981", "#34d399"] as [string, string],
    },
    carbs: {
      base: "#60a5fa", // blue-400
      gradient: ["#3b82f6", "#60a5fa"] as [string, string],
    },
    fats: {
      base: "#f87171", // red-400
      gradient: ["#ef4444", "#f87171"] as [string, string],
    },
  },
  mealType: {
    breakfast: {
      base: "#60a5fa", // blue-400
      gradient: ["#3b82f6", "#60a5fa"] as [string, string],
    },
    lunch: {
      base: "#34d399", // green-400
      gradient: ["#10b981", "#34d399"] as [string, string],
    },
    dinner: {
      base: "#f87171", // red-400
      gradient: ["#ef4444", "#f87171"] as [string, string],
    },
    snack: {
      base: "#a78bfa", // purple-400
      gradient: ["#8b5cf6", "#a78bfa"] as [string, string],
    },
  },
};

/**
 * Format to nicely capitalize words
 */
export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Shared visualization container
 */
export const ChartContainer: React.FC<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = "" }) => {
  return (
    <div
      className={`bg-gray-800/70 rounded-xl border border-gray-700/30 p-3 shadow-lg h-full flex flex-col ${className}`}
    >
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            {title && (
              <h3 className="text-base font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <span className="text-sm text-gray-400 truncate max-w-[160px] block">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-[150px]">{children}</div>
    </div>
  );
};
