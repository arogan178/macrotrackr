import { memo, useCallback, useState } from "react";

import { InfoCard } from "@/components/form";
import MacroTargetBar from "@/components/macros/MacroTargetBar";
import { InfoIcon } from "@/components/ui";
import { useMacroTarget } from "@/features/macroTracking/hooks/useMacroTarget";
import type { MacroTargetState, MacroType } from "@/types/macro";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";

import MacroSlider, { MacroBadge } from "./MacroSlider";

interface MacroTargetProps {
  initialValues?: MacroTargetState;
  onTargetChange: (target: MacroTargetState) => void;
}

const MacroTarget = memo(
  ({
    initialValues = DEFAULT_MACRO_TARGET,
    onTargetChange,
  }: MacroTargetProps) => {
    const [helpVisible, setHelpVisible] = useState(false);

    const { target, handleChange, toggleLock } = useMacroTarget(
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
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-foreground">Macro Target</h3>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setHelpVisible(!helpVisible)}
              className="rounded-full p-1 text-foreground transition-colors hover:bg-surface/50 hover:text-primary"
              aria-label={helpVisible ? "Hide help" : "Show help"}
              title="How to use this tool"
            >
              <InfoIcon className="" />
            </button>
          </div>
        </div>

        {helpVisible && (
          <InfoCard
            title="Tips for adjusting your macros:"
            color="accent"
            icon={<InfoIcon className="" />}
          >
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-foreground">
              <li>Drag the sliders to adjust percentages</li>
              <li>
                Click the lock icon to keep a macro fixed while adjusting others
              </li>
              <li>Total will always equal 100%</li>
              <li>Each macro requires at least 5%</li>
            </ul>
          </InfoCard>
        )}

        <MacroTargetBar target={target} className="mb-6" />

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

        <div className="grid grid-cols-3 gap-2 pt-5">
          <MacroBadge
            name="Protein"
            value={target.proteinPercentage}
            color="protein"
            isLocked={isLocked("protein")}
          />
          <MacroBadge
            name="Carbs"
            value={target.carbsPercentage}
            color="carbs"
            isLocked={isLocked("carbs")}
          />
          <MacroBadge
            name="Fats"
            value={target.fatsPercentage}
            color="fats"
            isLocked={isLocked("fats")}
          />
        </div>
      </div>
    );
  },
);

MacroTarget.displayName = "MacroTarget";

export default MacroTarget;
