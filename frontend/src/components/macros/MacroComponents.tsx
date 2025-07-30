import { memo } from "react";

import { AnimatedNumber } from "@/components/animation";
import { calculateCaloriePercentages } from "@/utils/nutrition";
import type { MacroNutrients } from "@/utils/nutritionTypes";

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
      className={`relative h-2 w-full bg-surface/30 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="absolute top-0 left-0 h-full bg-protein/80 transition-all duration-500"
        style={{ width: `${proteinPercent}%` }}
      />
      <div
        className="absolute top-0 h-full bg-carbs/80 transition-all duration-500"
        style={{ width: `${carbsPercent}%`, left: `${proteinPercent}%` }}
      />
      <div
        className="absolute top-0 h-full bg-fats/80 transition-all duration-500"
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
        <span className="inline-block w-2 h-2 bg-protein rounded-full mr-1"></span>
        <span className="text-foreground">{proteinPercent}%</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-2 h-2 bg-carbs rounded-full mr-1"></span>
        <span className="text-foreground">{carbsPercent}%</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-2 h-2 bg-fats rounded-full mr-1"></span>
        <span className="text-foreground">{fatsPercent}%</span>
      </div>
    </div>
  );
}

interface MacroIndicatorProps {
  name: string;
  value: number;
  target?: number;
  color: "protein" | "carbs" | "fats";
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
    protein: {
      dot: "bg-protein",
      text: "text-protein",
      bg: "bg-protein/80",
    },
    carbs: {
      dot: "bg-carbs",
      text: "text-carbs",
      bg: "bg-carbs/80",
    },
    fats: {
      dot: "bg-fats",
      text: "text-fats",
      bg: "bg-fats/80",
    },
    calories: {
      dot: "bg-vibrant-accent",
      text: "text-vibrant-accent",
      bg: "bg-vibrant-accent/80",
    },
  };

  // Calculate percentage if target is provided
  const percentage = target
    ? Math.min(Math.round((value / target) * 100), 100)
    : undefined;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-2 h-2 rounded-full ${colorClasses[color].dot}`}
        ></div>
        <span className="text-sm text-foreground">{name}</span>
        {showPercentage && percentage !== undefined && (
          <span className="text-xs text-foreground ml-auto">{percentage}%</span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-sm font-semibold text-foreground">
          {Math.round(value)}g
        </span>
        {target && <span className="text-xs text-foreground">/ {target}g</span>}
      </div>

      {target && (
        <div className="h-1.5 bg-surface/80 rounded-full overflow-hidden">
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
