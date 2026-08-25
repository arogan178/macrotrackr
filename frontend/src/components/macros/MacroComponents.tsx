import { memo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatGrouped } from "@/lib/formatNumber";
import type { MacroTargetGrams } from "@/types/macro";
import { calculateCaloriePercentages } from "@/utils/nutritionCalculations";

interface MacroBarProps {
  macros: MacroTargetGrams;
  className?: string;
}

/**
 * Renders a stacked bar representing macro distribution
 */
export function MacroDistributionStrip({
  macros,
  className = "",
}: MacroBarProps) {
  const { proteinPercent, carbsPercent, fatsPercent } =
    calculateCaloriePercentages(macros.protein, macros.carbs, macros.fats);

  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
    >
      <div
        className="absolute top-0 left-0 h-full bg-protein/80 transition-[width] duration-500"
        style={{ width: `${proteinPercent}%` }}
      />
      <div
        className="absolute top-0 h-full bg-carbs/80 transition-[left,width] duration-500"
        style={{ width: `${carbsPercent}%`, left: `${proteinPercent}%` }}
      />
      <div
        className="absolute top-0 h-full bg-fats/80 transition-[left,width] duration-500"
        style={{
          width: `${fatsPercent}%`,
          left: `${proteinPercent + carbsPercent}%`,
        }}
      />
    </div>
  );
}

export function MacroDistributionBar(properties: MacroBarProps) {
  return <MacroDistributionStrip {...properties} />;
}

interface MacroLegendProps {
  macros: MacroTargetGrams;
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
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-protein" />
        <span className="text-foreground">{proteinPercent}%</span>
      </div>
      <div className="flex items-center">
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-carbs" />
        <span className="text-foreground">{carbsPercent}%</span>
      </div>
      <div className="flex items-center">
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-fats" />
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
      dot: "bg-foreground",
      text: "text-foreground",
      bg: "bg-foreground/80",
    },
  };

  // Calculate percentage if target is provided
  const percentage = target
    ? Math.min(Math.round((value / target) * 100), 100)
    : undefined;

  return (
    <div className="flex flex-col min-w-0">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${colorClasses[color].dot}`} />
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">{name}</span>
        </div>

        <div className="flex items-baseline gap-1 text-xs sm:text-sm shrink-0">
          <span className="font-bold text-foreground">
            {formatGrouped(value)}g
          </span>
          {target !== undefined && target > 0 && (
            <span className="text-muted text-xs">/ {formatGrouped(target)}g</span>
          )}
          {showPercentage && percentage !== undefined && (
            <span className="ml-1 text-[11px] font-medium text-muted">
              ({percentage}%)
            </span>
          )}
        </div>
      </div>

      {typeof percentage === "number" && (
        <ProgressBar
          progress={percentage}
          color={color}
          height="sm"
          showPercentage={false}
        />
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
