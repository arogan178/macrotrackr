import { memo, useCallback, useState } from "react";

import { InfoCard } from "@/components/form";
import { InfoIcon } from "@/components/ui";
import MacroTargetBar from "@/features/macroTracking/components/MacroTargetBar";
import { useMacroTarget } from "@/features/macroTracking/hooks/useMacroTarget";
import type { MacroTargetProps, MacroType } from "@/types/macro";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";

import MacroSlider, { MacroBadge } from "./MacroSlider";

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
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-gray-200">Macro Target</h3>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setHelpVisible(!helpVisible)}
              className="text-gray-400 hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-gray-700/50"
              aria-label={helpVisible ? "Hide help" : "Show help"}
              title="How to use this tool"
            >
              <InfoIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {helpVisible && (
          <InfoCard
            title="Tips for adjusting your macros:"
            color="indigo"
            icon={<InfoIcon className="w-5 h-5" />}
          >
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-300 mt-2">
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
            color="green"
            isLocked={isLocked("protein")}
            onToggleLock={() => toggleLock("protein")}
            disabled={isSliderDisabled("protein")}
          />
          <MacroSlider
            name="Carbs"
            value={target.carbsPercentage}
            onChange={(value) => handleChange("carbs", value)}
            color="blue"
            isLocked={isLocked("carbs")}
            onToggleLock={() => toggleLock("carbs")}
            disabled={isSliderDisabled("carbs")}
          />
          <MacroSlider
            name="Fats"
            value={target.fatsPercentage}
            onChange={(value) => handleChange("fats", value)}
            color="red"
            isLocked={isLocked("fats")}
            onToggleLock={() => toggleLock("fats")}
            disabled={isSliderDisabled("fats")}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-5">
          <MacroBadge
            name="Protein"
            value={target.proteinPercentage}
            color="green"
            isLocked={isLocked("protein")}
          />
          <MacroBadge
            name="Carbs"
            value={target.carbsPercentage}
            color="blue"
            isLocked={isLocked("carbs")}
          />
          <MacroBadge
            name="Fats"
            value={target.fatsPercentage}
            color="red"
            isLocked={isLocked("fats")}
          />
        </div>
      </div>
    );
  },
);

MacroTarget.displayName = "MacroTarget";

export default MacroTarget;
