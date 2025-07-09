import { memo } from "react";
import type { MacroPercentages, MacroType } from "@/types/macro";
import { MacroBadge } from "./MacroSlider";

interface MacroBadgeGroupProps {
  percentages: MacroPercentages;
  lockedMacros: MacroType[];
  className?: string;
}

/**
 * Component that displays summary badges for macro distribution
 */
function MacroBadgeGroup({
  percentages,
  lockedMacros,
  className = "",
}: MacroBadgeGroupProps) {
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <MacroBadge
        name="Protein"
        value={percentages.proteinPercentage}
        color="green"
        isLocked={lockedMacros.includes("protein")}
      />

      <MacroBadge
        name="Carbs"
        value={percentages.carbsPercentage}
        color="blue"
        isLocked={lockedMacros.includes("carbs")}
      />

      <MacroBadge
        name="Fats"
        value={percentages.fatsPercentage}
        color="red"
        isLocked={lockedMacros.includes("fats")}
      />
    </div>
  );
}

export default memo(MacroBadgeGroup);
