import React, { useState, useMemo } from "react";
import MacroSlider, { MacroBadge } from "./MacroSlider";
import { InfoCard } from "@/components/form";
import { InfoIcon } from "@/components/Icons";
import { MacroType, MacroTargetProps, MacroTargetState } from "../types";
import { useMacroTarget } from "../hooks/useMacroTarget";
import MacroTargetBar from "./MacroTargetBar";

function MacroTarget({
  initialValues = {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
    lockedMacros: [],
  },
  onTargetChange,
}: MacroTargetProps) {
  // State for UI elements
  const [helpVisible, setHelpVisible] = useState(false);

  // Use our custom hook for macro management with modified callback
  const { target, isAdjusting, handleChange, toggleLock } = useMacroTarget(
    initialValues,
    (updatedTarget, shouldPersist = true) => {
      // Always propagate changes to the parent component, ensuring locks are treated as changes too
      onTargetChange(updatedTarget);
    }
  );

  return (
    <div className="space-y-6 py-2">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium text-gray-200">Macro Target</h3>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setHelpVisible(!helpVisible)}
            className="text-gray-400 hover:text-indigo-300 transition-colors"
            aria-label={helpVisible ? "Hide help" : "Show help"}
            title="How to use this tool"
          >
            <InfoIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Help information card */}
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

      {/* Visual macro percentage bar */}
      <MacroTargetBar target={target} className="mb-6" />

      {/* Sliders section */}
      <div className="space-y-6">
        {/* Protein Slider */}
        <MacroSlider
          name="Protein"
          value={target.proteinPercentage}
          onChange={(value) => handleChange("protein", value)}
          color="green"
          isLocked={target.lockedMacros.includes("protein")}
          onToggleLock={() => toggleLock("protein")}
          disabled={false}
        />

        {/* Carbs Slider */}
        <MacroSlider
          name="Carbs"
          value={target.carbsPercentage}
          onChange={(value) => handleChange("carbs", value)}
          color="blue"
          isLocked={target.lockedMacros.includes("carbs")}
          onToggleLock={() => toggleLock("carbs")}
          disabled={false}
        />

        {/* Fats Slider */}
        <MacroSlider
          name="Fats"
          value={target.fatsPercentage}
          onChange={(value) => handleChange("fats", value)}
          color="red"
          isLocked={target.lockedMacros.includes("fats")}
          onToggleLock={() => toggleLock("fats")}
          disabled={false}
        />
      </div>

      {/* Badges section */}
      <div className="grid grid-cols-3 gap-2 pt-5">
        {/* Protein Badge */}
        <MacroBadge
          name="Protein"
          value={target.proteinPercentage}
          color="green"
          isLocked={target.lockedMacros.includes("protein")}
        />

        {/* Carbs Badge */}
        <MacroBadge
          name="Carbs"
          value={target.carbsPercentage}
          color="blue"
          isLocked={target.lockedMacros.includes("carbs")}
        />

        {/* Fats Badge */}
        <MacroBadge
          name="Fats"
          value={target.fatsPercentage}
          color="red"
          isLocked={target.lockedMacros.includes("fats")}
        />
      </div>
    </div>
  );
}

export default React.memo(MacroTarget);
