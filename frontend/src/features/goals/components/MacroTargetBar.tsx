import { memo } from "react";
import type { MacroTargetState } from "../types/types";

interface MacroTargetBarProps {
  target: MacroTargetState;
  className?: string;
}

function MacroTargetBar({ target, className = "" }: MacroTargetBarProps) {
  return (
    <div
      className={`relative h-2 rounded-full overflow-hidden bg-gray-700/30 ${className}`}
    >
      <div
        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-green-500 to-green-600"
        style={{ width: `${target.proteinPercentage}%` }}
        aria-label={`Protein: ${target.proteinPercentage}%`}
      />
      <div
        className="absolute top-0 h-2 bg-gradient-to-r from-blue-500 to-blue-600"
        style={{
          width: `${target.carbsPercentage}%`,
          left: `${target.proteinPercentage}%`,
        }}
        aria-label={`Carbs: ${target.carbsPercentage}%`}
      />
      <div
        className="absolute top-0 h-2 bg-gradient-to-r from-red-500 to-red-600"
        style={{
          width: `${target.fatsPercentage}%`,
          left: `${target.proteinPercentage + target.carbsPercentage}%`,
        }}
        aria-label={`Fats: ${target.fatsPercentage}%`}
      />
    </div>
  );
}

export default memo(MacroTargetBar);
