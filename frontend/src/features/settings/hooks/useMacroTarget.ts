import { useCallback, useState } from "react";

import { MacroPercentages, MacroTargetState, MacroType } from "@/types/macro";
import { MACRO_PERCENTAGE_KEYS } from "@/utils/constants/macro";

/**
 * Custom hook to manage macro target distribution state
 * Handles the complex logic of keeping percentages summing to 100%
 * while respecting locked macros and min/max constraints
 */
export function useMacroTarget(
  initialValues: MacroTargetState,
  onChange?: (target: MacroTargetState, shouldPersist?: boolean) => void,
) {
  const [target, setTarget] = useState<MacroTargetState>(initialValues);
  const [isAdjusting, setIsAdjusting] = useState<MacroType | undefined>();

  // Calculate macro distribution when one value changes
  const calculateMacroAdjustment = useCallback(
    (
      currentTarget: MacroTargetState,
      macro: MacroType,
      value: number,
    ): MacroTargetState => {
      // Enforce min/max constraints
      value = Math.round(Math.max(5, Math.min(70, value)));

      const targetCopy = { ...currentTarget };
      targetCopy[`${macro}Percentage` as keyof MacroPercentages] = value;

      // The current macro might be locked - we need to check
      const isCurrentMacroLocked = targetCopy.lockedMacros.includes(macro);

      // Get unlocked macros (except the one being adjusted)
      const unlockedMacros = ["protein", "carbs", "fats"].filter(
        (m) => m !== macro && !targetCopy.lockedMacros.includes(m as MacroType),
      ) as MacroType[];
      // Map to get the keys for these macros
      const unlockedKeys = unlockedMacros.map(
        (m) => `${m}Percentage` as keyof MacroPercentages,
      );

      // Calculate values for locked macros (excluding current if it's locked)
      let lockedMacrosSum = 0;
      for (const m of targetCopy.lockedMacros) {
        if (m !== macro || !isCurrentMacroLocked) {
          const key = `${m}Percentage` as keyof MacroPercentages;
          lockedMacrosSum += targetCopy[key];
        }
      }

      // Calculate remaining percentage for unlocked macros
      const remainingTotal = 100 - value - lockedMacrosSum;

      // Different strategies based on number of unlocked macros
      if (unlockedKeys.length === 0) {
        // All other macros are locked - adjust current if needed to maintain 100%
        if (value + lockedMacrosSum !== 100 && !isCurrentMacroLocked) {
          targetCopy[`${macro}Percentage` as keyof MacroPercentages] = Math.max(
            5,
            Math.min(70, 100 - lockedMacrosSum),
          );
        }
      } else if (unlockedKeys.length === 1) {
        // Only one unlocked macro - it gets all remaining percentage
        const singleUnlockedKey = unlockedKeys[0];
        const newValue = Math.round(Math.max(5, Math.min(70, remainingTotal)));

        // If we can't set to the target value due to min/max constraints,
        // we need to readjust the macro being changed
        if (newValue !== remainingTotal) {
          const difference = remainingTotal - newValue;
          targetCopy[`${macro}Percentage` as keyof MacroPercentages] = Math.max(
            5,
            Math.min(70, value - difference),
          );
        }

        targetCopy[singleUnlockedKey] = newValue;
      } else {
        // Multiple unlocked macros - distribute proportionally
        let currentUnlockedTotal = 0;
        for (const key of unlockedKeys) {
          currentUnlockedTotal += targetCopy[key];
        }

        if (currentUnlockedTotal > 0) {
          // Distribute proportionally
          let total = 0;
          for (const key of unlockedKeys) {
            const proportion = targetCopy[key] / currentUnlockedTotal;
            targetCopy[key] = Math.round(
              Math.max(5, Math.min(70, remainingTotal * proportion)),
            );
            total += targetCopy[key];
          }

          // Handle rounding errors
          if (total !== remainingTotal) {
            const difference = remainingTotal - total;

            // Find an adjustable key
            const adjustableKey = unlockedKeys.find(
              (key) =>
                targetCopy[key] + difference >= 5 &&
                targetCopy[key] + difference <= 70,
            );

            if (adjustableKey) {
              targetCopy[adjustableKey] += difference;
            } else if (difference < 0) {
              // If we can't adjust unlocked macros, adjust the current macro
              targetCopy[`${macro}Percentage` as keyof MacroPercentages] =
                Math.max(
                  5,
                  targetCopy[`${macro}Percentage` as keyof MacroPercentages] +
                    difference,
                );
            }
          }
        } else {
          // If all unlocked macros are zero, distribute evenly
          const perMacro = Math.floor(remainingTotal / unlockedKeys.length);
          let remainder = remainingTotal - perMacro * unlockedKeys.length;

          for (const key of unlockedKeys) {
            targetCopy[key] = perMacro + (remainder > 0 ? 1 : 0);
            remainder--;
          }
        }
      }

      // Final sanity check
      const finalSum =
        targetCopy.proteinPercentage +
        targetCopy.carbsPercentage +
        targetCopy.fatsPercentage;

      if (finalSum !== 100) {
        // Find an adjustable macro to fix the total

        const adjustableKeys = (
          MACRO_PERCENTAGE_KEYS as readonly (keyof MacroPercentages)[]
        )
          .filter((key) => {
            const macroName = key.replace("Percentage", "") as MacroType;
            return (
              !targetCopy.lockedMacros.includes(macroName) ||
              macroName === macro
            );
          })
          .filter((key) => {
            const currentValue = targetCopy[key];
            return currentValue > 5 && currentValue < 70;
          });

        if (adjustableKeys.length > 0) {
          // Prefer adjusting the macro that's being changed
          const preferredKey = `${macro}Percentage` as keyof MacroPercentages;
          const keyToAdjust = adjustableKeys.includes(preferredKey)
            ? preferredKey
            : adjustableKeys[0];
          targetCopy[keyToAdjust] += 100 - finalSum;
        }
      }

      return targetCopy;
    },
    [],
  );

  /**
   * Handle macro value change
   */
  const handleChange = useCallback(
    (macro: MacroType, value: number) => {
      setIsAdjusting(macro);

      const adjustedTarget = calculateMacroAdjustment(target, macro, value);

      setTarget(adjustedTarget);
      // Percentage changes should be persisted when saved
      onChange?.(adjustedTarget, true);

      // Clear adjustment state after a brief delay
      setTimeout(() => setIsAdjusting(undefined), 100);
    },
    [target, calculateMacroAdjustment, onChange],
  );

  /**
   * Toggle lock status for a macro
   * This is a UI-only state change and should not trigger persistence
   */
  const toggleLock = useCallback(
    (macro: MacroType) => {
      const updatedTarget = { ...target };

      if (updatedTarget.lockedMacros.includes(macro)) {
        // Unlock the macro
        updatedTarget.lockedMacros = updatedTarget.lockedMacros.filter(
          (m) => m !== macro,
        );
      } else {
        // Don't allow locking all three macros
        if (updatedTarget.lockedMacros.length < 2) {
          updatedTarget.lockedMacros = [...updatedTarget.lockedMacros, macro];
        } else {
          return; // Can't lock all three
        }
      }

      setTarget(updatedTarget);
      // Lock changes are UI-only state, don't mark for persistence
      onChange?.(updatedTarget, false);
    },
    [target, onChange],
  );

  return {
    target,
    isAdjusting,
    handleChange,
    toggleLock,
  };
}
