import { useState, useEffect, useCallback } from "react";
import type { MacroType, MacroTargetState, MacroKey } from "@/types/macro";

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
  const [isAdjusting, setIsAdjusting] = useState<MacroType | null>(null);

  // Sync with initial values when they change (but not during adjustment)
  useEffect(() => {
    if (initialValues && !isAdjusting) {
      setTarget(initialValues);
    }
  }, [initialValues, isAdjusting]);

  // Ensure percentages always sum to 100%
  useEffect(() => {
    if (!isAdjusting) {
      const sum =
        target.proteinPercentage +
        target.carbsPercentage +
        target.fatsPercentage;
      if (sum !== 100) {
        const adjusted = balanceMacroPercentages(target);
        setTarget(adjusted);
        // This is a calculation adjustment, not a user action - don't mark for persistence
        onChange?.(adjusted, false);
      }
    }
  }, [target, isAdjusting, onChange]);

  /**
   * Balance macro percentages to ensure they sum to 100%
   */
  const balanceMacroPercentages = useCallback(
    (currentTarget: MacroTargetState): MacroTargetState => {
      const sum =
        (currentTarget.proteinPercentage as number) +
        (currentTarget.carbsPercentage as number) +
        (currentTarget.fatsPercentage as number);
      if (sum === 100) return currentTarget;

      const adjusted = { ...currentTarget };

      // Get unlocked macros that can be adjusted
      const unlockedMacros: MacroKey[] = (
        ["proteinPercentage", "carbsPercentage", "fatsPercentage"] as MacroKey[]
      ).filter(
        (key) =>
          !currentTarget.lockedMacros.includes(
            key.replace("Percentage", "") as MacroType,
          ),
      );

      if (unlockedMacros.length === 0) {
        // All macros are locked - we need to adjust one anyway to maintain 100%
        const key: MacroKey = "proteinPercentage";
        adjusted[key] =
          100 -
          ((adjusted.carbsPercentage as number) +
            (adjusted.fatsPercentage as number));
      } else if (sum > 100) {
        // Find the largest unlocked macro to reduce
        const largest = unlockedMacros.reduce((a, b) =>
          (adjusted[a] as number) > (adjusted[b] as number) ? a : b,
        );
        adjusted[largest] = (adjusted[largest] as number) - (sum - 100);
      } else {
        // Find the smallest unlocked macro to increase
        const smallest = unlockedMacros.reduce((a, b) =>
          (adjusted[a] as number) < (adjusted[b] as number) ? a : b,
        );
        adjusted[smallest] = (adjusted[smallest] as number) + (100 - sum);
      }

      return adjusted;
    },
    [],
  );

  /**
   * Calculate macro distribution when one value changes
   */
  const calculateMacroAdjustment = useCallback(
    (
      currentTarget: MacroTargetState,
      macro: MacroType,
      value: number,
    ): MacroTargetState => {
      // Enforce min/max constraints
      value = Math.round(Math.max(5, Math.min(70, value)));

      const updatedTarget = { ...currentTarget };
      const macroKey = `${macro}Percentage` as MacroKey;
      updatedTarget[macroKey] = value;

      // The current macro might be locked - we need to check
      const isCurrentMacroLocked = updatedTarget.lockedMacros.includes(macro);

      // Get unlocked macros (except the one being adjusted)
      const unlockedMacrosArr = ["protein", "carbs", "fats"].filter(
        (m) =>
          m !== macro && !updatedTarget.lockedMacros.includes(m as MacroType),
      ) as MacroType[];
      const unlockedKeys: MacroKey[] = unlockedMacrosArr.map(
        (m) => `${m}Percentage` as MacroKey,
      );

      // Calculate values for locked macros (excluding current if it's locked)
      const lockedMacrosSum = updatedTarget.lockedMacros
        .filter((m) => m !== macro || !isCurrentMacroLocked)
        .reduce(
          (sum, m) =>
            sum + (updatedTarget[`${m}Percentage` as MacroKey] as number),
          0,
        );

      // Calculate remaining percentage for unlocked macros
      const remainingTotal = 100 - value - lockedMacrosSum;

      // Different strategies based on number of unlocked macros
      if (unlockedKeys.length === 0) {
        // All other macros are locked - adjust current if needed to maintain 100%
        if (value + lockedMacrosSum !== 100 && !isCurrentMacroLocked) {
          updatedTarget[macroKey] = Math.max(
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
          updatedTarget[macroKey] = Math.max(
            5,
            Math.min(70, value - difference),
          );
        }

        updatedTarget[singleUnlockedKey] = newValue;
      } else {
        // Multiple unlocked macros - distribute proportionally
        const currentUnlockedTotal = unlockedKeys.reduce(
          (sum, key) => sum + (updatedTarget[key] as number),
          0,
        );

        if (currentUnlockedTotal > 0) {
          // Distribute proportionally
          let newTotal = 0;
          unlockedKeys.forEach((key) => {
            const proportion =
              (updatedTarget[key] as number) / currentUnlockedTotal;
            const newValue = Math.round(
              Math.max(5, Math.min(70, remainingTotal * proportion)),
            );
            updatedTarget[key] = newValue;
            newTotal += newValue;
          });

          // Handle rounding errors
          if (newTotal !== remainingTotal) {
            const difference = remainingTotal - newTotal;

            // Find an adjustable key
            const adjustableKey = unlockedKeys.find((key) => {
              const val = updatedTarget[key] as number;
              return val + difference >= 5 && val + difference <= 70;
            });

            if (adjustableKey) {
              updatedTarget[adjustableKey] =
                (updatedTarget[adjustableKey] as number) + difference;
            } else if (difference < 0) {
              // If we can't adjust unlocked macros, adjust the current macro
              updatedTarget[macroKey] = Math.max(
                5,
                (updatedTarget[macroKey] as number) + difference,
              );
            }
          }
        } else {
          // If all unlocked macros are zero, distribute evenly
          const perMacro = Math.floor(remainingTotal / unlockedKeys.length);
          let remainder = remainingTotal - perMacro * unlockedKeys.length;

          unlockedKeys.forEach((key) => {
            updatedTarget[key] = perMacro + (remainder > 0 ? 1 : 0);
            remainder--;
          });
        }
      }

      // Final sanity check
      const finalSum =
        (updatedTarget.proteinPercentage as number) +
        (updatedTarget.carbsPercentage as number) +
        (updatedTarget.fatsPercentage as number);

      if (finalSum !== 100) {
        // Find an adjustable macro to fix the total
        const adjustableKeys = (
          [
            "proteinPercentage",
            "carbsPercentage",
            "fatsPercentage",
          ] as MacroKey[]
        )
          .filter((key) => {
            const macroName = key.replace("Percentage", "") as MacroType;
            return (
              !updatedTarget.lockedMacros.includes(macroName) ||
              macroName === macro
            );
          })
          .filter((key) => {
            const currentValue = updatedTarget[key as MacroKey] as number;
            return currentValue > 5 && currentValue < 70;
          }) as MacroKey[];

        if (adjustableKeys.length > 0) {
          // Prefer adjusting the macro that's being changed
          const preferredKey = macroKey;
          const keyToAdjust = adjustableKeys.includes(preferredKey)
            ? preferredKey
            : adjustableKeys[0];
          updatedTarget[keyToAdjust] =
            (updatedTarget[keyToAdjust] as number) + (100 - finalSum);
        }
      }

      return updatedTarget;
    },
    [],
  );

  /**
   * Handle macro value change
   */
  const handleChange = useCallback(
    (macro: MacroType, value: number) => {
      const updatedTarget = calculateMacroAdjustment(target, macro, value);
      setTarget(updatedTarget);
      // Percentage changes should be persisted when saved
      onChange?.(updatedTarget, true);
      // Clear adjustment state after a brief delay
      setTimeout(() => setIsAdjusting(null), 100);
    },
    [target, calculateMacroAdjustment, onChange],
  );

  /**
   * Toggle lock status for a macro
   * This is a UI-only state change and should not trigger persistence
   */
  const toggleLock = useCallback(
    (macro: MacroType) => {
      const newTarget = { ...target };

      if (newTarget.lockedMacros.includes(macro)) {
        // Unlock the macro
        newTarget.lockedMacros = newTarget.lockedMacros.filter(
          (m) => m !== macro,
        );
      } else {
        // Don't allow locking all three macros
        if (newTarget.lockedMacros.length < 2) {
          newTarget.lockedMacros = [...newTarget.lockedMacros, macro];
        } else {
          return; // Can't lock all three
        }
      }

      setTarget(newTarget);
      // Lock changes are UI-only state, don't mark for persistence
      onChange?.(newTarget, false);
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
