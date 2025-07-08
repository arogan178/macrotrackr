import { useState, useCallback, memo } from "react";
// Assuming components and types are correctly located relative to this file
import MacroSlider from "./MacroSlider";
import { MacroBadge } from "./MacroSlider"; // Assuming MacroBadge is exported from MacroSlider file
import { InfoCard } from "@/components/form";
import { InfoIcon } from "@/components/Icons";
import FormButton from "@/components/form/FormButton";
import { MacroType, MacroTargetProps } from "../types/types"; // Ensure these types are correct
import { useMacroTarget } from "../hooks/useMacroTarget"; // The custom hook managing logic
import MacroTargetBar from "./MacroTargetBar"; // The visualization component

// Default values remain the same
const DEFAULT_TARGET_VALUES = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
  lockedMacros: [],
};

// Use React.memo for performance optimization
const MacroTarget = memo(
  ({
    initialValues = DEFAULT_TARGET_VALUES,
    onTargetChange,
  }: MacroTargetProps) => {
    // State for UI elements not handled by the hook
    const [helpVisible, setHelpVisible] = useState(false);

    // Use the custom hook for core state and logic management
    // The hook provides the current target state and functions to modify it
    const { target, handleChange, toggleLock } = useMacroTarget(
      initialValues,
      // Callback to notify parent component of changes
      // This ensures the parent always gets the latest state including locks
      (updatedTarget) => {
        onTargetChange(updatedTarget);
      }
    );

    // Helper to check if a specific macro is locked
    const isLocked = useCallback(
      (macro: MacroType) => target.lockedMacros.includes(macro),
      [target.lockedMacros]
    );

    // Determine if a slider should be disabled (if 2 others are locked)
    const isSliderDisabled = useCallback(
      (macro: MacroType) => {
        return target.lockedMacros.length === 2 && !isLocked(macro);
      },
      [target.lockedMacros, isLocked]
    );

    return (
      <div className="space-y-6 py-2">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-gray-200">Macro Target</h3>
          <div className="flex items-center">
            <FormButton
              type="button"
              onClick={() => setHelpVisible(!helpVisible)}
              variant="ghost"
              size="sm"
              ariaLabel={helpVisible ? "Hide help" : "Show help"}
              title="How to use this tool"
              icon={<InfoIcon className="w-5 h-5" />}
              className="text-gray-400 hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-gray-700/50 cursor-pointer"
            />
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
          <MacroSlider
            name="Protein"
            value={target.proteinPercentage}
            onChange={(value) => handleChange("protein", value)}
            color="green"
            isLocked={isLocked("protein")}
            onToggleLock={() => toggleLock("protein")}
            // Restore disabled logic: Disable if 2 *others* are locked
            disabled={isSliderDisabled("protein")}
          />
          <MacroSlider
            name="Carbs"
            value={target.carbsPercentage}
            onChange={(value) => handleChange("carbs", value)}
            color="blue"
            isLocked={isLocked("carbs")}
            onToggleLock={() => toggleLock("carbs")}
            // Restore disabled logic
            disabled={isSliderDisabled("carbs")}
          />
          <MacroSlider
            name="Fats"
            value={target.fatsPercentage}
            onChange={(value) => handleChange("fats", value)}
            color="red"
            isLocked={isLocked("fats")}
            onToggleLock={() => toggleLock("fats")}
            // Restore disabled logic
            disabled={isSliderDisabled("fats")}
          />
        </div>

        {/* Badges section */}
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
  }
); // Close React.memo

MacroTarget.displayName = "MacroTarget"; // Add display name for DevTools

export default MacroTarget;
