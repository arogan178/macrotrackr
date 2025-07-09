import { calculateCaloriePercentages } from "@/utils/nutrition";
import type { MacroNutrients } from "@/utils/nutrition-types";
import { memo } from "react";
import AnimatedNumber from "@/components/animation/AnimatedNumber";

interface MacroBarProps {
  macros: MacroNutrients;
  className?: string;
}

/**
 * Renders a stacked bar representing macro distribution
 */
export function MacroTargetBar({ macros, className = "" }: MacroBarProps) {
  const { proteinPercent, carbsPercent, fatsPercent } =
    calculateCaloriePercentages(macros.protein, macros.carbs, macros.fats);

  return (
    <div
      className={`relative h-2 w-full bg-gray-700/30 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="absolute top-0 left-0 h-full bg-green-500/80 transition-all duration-500"
        style={{ width: `${proteinPercent}%` }}
      />
      <div
        className="absolute top-0 h-full bg-blue-500/80 transition-all duration-500"
        style={{ width: `${carbsPercent}%`, left: `${proteinPercent}%` }}
      />
      <div
        className="absolute top-0 h-full bg-red-500/80 transition-all duration-500"
        style={{
          width: `${fatsPercent}%`,
          left: `${proteinPercent + carbsPercent}%`,
        }}
      />
    </div>
  );
}

interface MacroLegendProps {
  macros: MacroNutrients;
  className?: string;
}

/**
 * Renders a legend for macro distribution
 */
export function MacroTargetLegend({
  macros,
  className = "",
}: MacroLegendProps) {
  const { proteinPercent, carbsPercent, fatsPercent } =
    calculateCaloriePercentages(macros.protein, macros.carbs, macros.fats);

  return (
    <div className={`flex justify-between text-xs ${className}`}>
      <div className="flex items-center">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
        <span className="text-gray-400">{proteinPercent}%</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
        <span className="text-gray-400">{carbsPercent}%</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
        <span className="text-gray-400">{fatsPercent}%</span>
      </div>
    </div>
  );
}

interface MacroIndicatorProps {
  name: string;
  value: number;
  target?: number;
  color: "green" | "blue" | "red";
  showPercentage?: boolean;
}

/**
 * Component for displaying single macro value with optional target
 */
export function MacroIndicator({
  name,
  value,
  target,
  color,
  showPercentage = false,
}: MacroIndicatorProps) {
  const colorClasses = {
    green: {
      dot: "bg-green-500",
      text: "text-green-400",
      bg: "bg-green-500/80",
    },
    blue: {
      dot: "bg-blue-500",
      text: "text-blue-400",
      bg: "bg-blue-500/80",
    },
    red: {
      dot: "bg-red-500",
      text: "text-red-400",
      bg: "bg-red-500/80",
    },
  };

  // Calculate percentage if target is provided
  const percentage = target
    ? Math.min(Math.round((value / target) * 100), 100)
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-2 h-2 rounded-full ${colorClasses[color].dot}`}
        ></div>
        <span className="text-sm text-gray-300">{name}</span>
        {showPercentage && percentage !== null && (
          <span className="text-xs text-gray-400 ml-auto">{percentage}%</span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-sm font-semibold text-gray-200">
          {Math.round(value)}g
        </span>
        {target && <span className="text-xs text-gray-500">/ {target}g</span>}
      </div>

      {target && (
        <div className="h-1.5 bg-gray-700/80 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${colorClasses[color].bg}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface MacroCellProps {
  value: number;
  suffix: string;
  color: string;
}

/**
 * Displays a macro value with animated number and consistent styling
 */
export const MacroCell = memo(({ value, suffix, color }: MacroCellProps) => (
  <span className={`font-medium ${color}`}>
    <AnimatedNumber value={Math.round(value) || 0} suffix={suffix} />
  </span>
));

MacroCell.displayName = "MacroCell";
