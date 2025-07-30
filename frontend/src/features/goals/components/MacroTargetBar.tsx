// src/features/macroTracking/components/MacroTargetBar.tsx

import { memo } from "react";
import type { MacroTargetState } from "@/types/macro";

interface MacroTargetBarProps {
  target: MacroTargetState;
  className?: string;
}

function MacroTargetBar({ target, className = "" }: MacroTargetBarProps) {
  return (
    <div
      className={`relative h-2 rounded-full overflow-hidden bg-surface/30 ${className}`}
    >
      <div
        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-protein to-protein/80"
        style={{ width: `${target.proteinPercentage}%` }}
        aria-label={`Protein: ${target.proteinPercentage}%`}
      />
      <div
        className="absolute top-0 h-2 bg-gradient-to-r from-carbs to-carbs/80"
        style={{
          width: `${target.carbsPercentage}%`,
          left: `${target.proteinPercentage}%`,
        }}
        aria-label={`Carbs: ${target.carbsPercentage}%`}
      />
      <div
        className="absolute top-0 h-2 bg-gradient-to-r from-fats to-fats/80"
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
