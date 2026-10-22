import { memo, useCallback } from "react";

import { useMacroTargetCore as useEditableMacroTargetCore } from "@/features/macroTracking/hooks/useMacroTargetCore";
import type { MacroTargetState, MacroType } from "@/types/macro";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";

import MacroSlider from "./MacroSlider";

const NOTES: Record<MacroType, string> = {
  protein: "Repairs and builds muscle.",
  carbs: "Your main source of energy.",
  fats: "Needed for hormones and absorbing vitamins.",
};

const KCAL_PER_GRAM: Record<MacroType, number> = { protein: 4, carbs: 4, fats: 9 };

interface MacroTargetProps {
  initialValues?: MacroTargetState;
  onTargetChange: (target: MacroTargetState) => void;
  /** The daily calorie target, so each share can be read in grams. */
  calorieTarget?: number;
}

const MacroTarget = memo(
  ({
    initialValues = DEFAULT_MACRO_TARGET,
    onTargetChange,
    calorieTarget,
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

    const grams = (macro: MacroType, percentage: number) =>
      calorieTarget
        ? (calorieTarget * percentage) / 100 / KCAL_PER_GRAM[macro]
        : undefined;

    const isSliderDisabled = useCallback(
      (macro: MacroType) => {
        return target.lockedMacros.length === 2 && !isLocked(macro);
      },
      [target.lockedMacros, isLocked],
    );

    return (
      <div className="py-2">
        {/* The split as one bar, solid fills like the Home gauge. */}
        <div
          className="mb-2 flex h-2 overflow-hidden rounded-full bg-foreground/8"
          aria-hidden
        >
          <div
            className="h-full bg-protein"
            style={{ width: `${target.proteinPercentage}%` }}
          />
          <div
            className="h-full bg-carbs"
            style={{ width: `${target.carbsPercentage}%` }}
          />
          <div
            className="h-full bg-fats"
            style={{ width: `${target.fatsPercentage}%` }}
          />
        </div>

        {/* Each macro's note sits on its own row, so the reason for a range
            is read beside the slider that sets it. */}
        <div className="divide-y divide-border [&>*]:py-5 [&>*:last-child]:pb-0">
          <MacroSlider
            name="Protein"
            value={target.proteinPercentage}
            onChange={(value) => handleChange("protein", value)}
            color="protein"
            isLocked={isLocked("protein")}
            onToggleLock={() => toggleLock("protein")}
            disabled={isSliderDisabled("protein")}
            note={NOTES.protein}
            grams={grams("protein", target.proteinPercentage)}
          />
          <MacroSlider
            name="Carbs"
            value={target.carbsPercentage}
            onChange={(value) => handleChange("carbs", value)}
            color="carbs"
            isLocked={isLocked("carbs")}
            onToggleLock={() => toggleLock("carbs")}
            disabled={isSliderDisabled("carbs")}
            note={NOTES.carbs}
            grams={grams("carbs", target.carbsPercentage)}
          />
          <MacroSlider
            name="Fats"
            value={target.fatsPercentage}
            onChange={(value) => handleChange("fats", value)}
            color="fats"
            isLocked={isLocked("fats")}
            onToggleLock={() => toggleLock("fats")}
            disabled={isSliderDisabled("fats")}
            note={NOTES.fats}
            grams={grams("fats", target.fatsPercentage)}
          />
        </div>
      </div>
    );
  },
);

MacroTarget.displayName = "MacroTarget";

export default MacroTarget;
