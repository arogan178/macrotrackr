import { memo, useCallback } from "react";

import { useMacroTargetCore as useEditableMacroTargetCore } from "@/features/macroTracking/hooks/useMacroTargetCore";
import type { MacroTargetState, MacroType } from "@/types/macro";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";

import MacroSlider from "./MacroSlider";

interface MacroTargetProps {
  initialValues?: MacroTargetState;
  onTargetChange: (target: MacroTargetState) => void;
}

const MacroTarget = memo(
  ({
    initialValues = DEFAULT_MACRO_TARGET,
    onTargetChange,
  }: MacroTargetProps) => {

    const { target, handleChange, toggleLock } = useEditableMacroTargetCore(
      initialValues,
      (updatedTarget) => {
        onTargetChange(updatedTarget);
      },
    );

    const isLocked = useCallback(
      (macro: MacroType) => target.lockedMacros.includes(macro),
      [target.lockedMacros],
    );

    const isSliderDisabled = useCallback(
      (macro: MacroType) => {
        return target.lockedMacros.length === 2 && !isLocked(macro);
      },
      [target.lockedMacros, isLocked],
    );

    return (
      <div className="space-y-6 py-2">
        <div className="relative mb-6 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-protein/80 to-protein"
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

        <div className="space-y-6">
          <MacroSlider
            name="Protein"
            value={target.proteinPercentage}
            onChange={(value) => handleChange("protein", value)}
            color="protein"
            isLocked={isLocked("protein")}
            onToggleLock={() => toggleLock("protein")}
            disabled={isSliderDisabled("protein")}
          />
          <MacroSlider
            name="Carbs"
            value={target.carbsPercentage}
            onChange={(value) => handleChange("carbs", value)}
            color="carbs"
            isLocked={isLocked("carbs")}
            onToggleLock={() => toggleLock("carbs")}
            disabled={isSliderDisabled("carbs")}
          />
          <MacroSlider
            name="Fats"
            value={target.fatsPercentage}
            onChange={(value) => handleChange("fats", value)}
            color="fats"
            isLocked={isLocked("fats")}
            onToggleLock={() => toggleLock("fats")}
            disabled={isSliderDisabled("fats")}
          />
        </div>
      </div>
    );
  },
);

MacroTarget.displayName = "MacroTarget";

export default MacroTarget;
