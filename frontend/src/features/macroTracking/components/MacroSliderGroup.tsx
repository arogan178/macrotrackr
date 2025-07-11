import { memo } from "react";

import { MacroPercentages, MacroType } from "@/types/macro";

import MacroSlider from "./MacroSlider";

interface MacroSliderGroupProps {
  percentages: MacroPercentages;
  lockedMacros: MacroType[];
  onMacroChange: (macro: MacroType, value: number) => void;
  onToggleLock: (macro: MacroType) => void;
  className?: string;
}

/**
 * Component that groups all macro sliders together
 */
function MacroSliderGroup({
  percentages,
  lockedMacros,
  onMacroChange,
  onToggleLock,
  className = "",
}: MacroSliderGroupProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <MacroSlider
        name="Protein"
        value={percentages.proteinPercentage}
        onChange={(value) => onMacroChange("protein", value)}
        color="green"
        isLocked={lockedMacros.includes("protein")}
        onToggleLock={() => onToggleLock("protein")}
        disabled={false}
      />

      <MacroSlider
        name="Carbs"
        value={percentages.carbsPercentage}
        onChange={(value) => onMacroChange("carbs", value)}
        color="blue"
        isLocked={lockedMacros.includes("carbs")}
        onToggleLock={() => onToggleLock("carbs")}
        disabled={false}
      />

      <MacroSlider
        name="Fats"
        value={percentages.fatsPercentage}
        onChange={(value) => onMacroChange("fats", value)}
        color="red"
        isLocked={lockedMacros.includes("fats")}
        onToggleLock={() => onToggleLock("fats")}
        disabled={false}
      />
    </div>
  );
}

export default memo(MacroSliderGroup);
