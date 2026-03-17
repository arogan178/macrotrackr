import { useCallback, useState } from "react";

import type {
  MacroKey,
  MacroTargetState,
  MacroType,
} from "@/types/macro";

export interface UseMacroTargetOptions {
  syncExternalChanges?: boolean;
}

function getUnlockedMacroKeys(
  target: MacroTargetState,
  currentMacro?: MacroType,
): MacroKey[] {
  return ([
    "proteinPercentage",
    "carbsPercentage",
    "fatsPercentage",
  ] as MacroKey[]).filter((key) => {
    const macroName = key.replace("Percentage", "") as MacroType;

    return macroName !== currentMacro && !target.lockedMacros.includes(macroName);
  });
}

export function balanceMacroPercentages(
  currentTarget: MacroTargetState,
): MacroTargetState {
  const sum =
    currentTarget.proteinPercentage +
    currentTarget.carbsPercentage +
    currentTarget.fatsPercentage;

  if (sum === 100) {
    return currentTarget;
  }

  const adjusted = { ...currentTarget };
  const unlockedKeys = getUnlockedMacroKeys(currentTarget);

  if (unlockedKeys.length === 0) {
    adjusted.proteinPercentage =
      100 - (adjusted.carbsPercentage + adjusted.fatsPercentage);

    return adjusted;
  }

  const keyToAdjust = unlockedKeys.reduce((bestKey, key) => {
    if (sum > 100) {
      return adjusted[key] > adjusted[bestKey] ? key : bestKey;
    }

    return adjusted[key] < adjusted[bestKey] ? key : bestKey;
  }, unlockedKeys[0]);

  adjusted[keyToAdjust] += sum > 100 ? -(sum - 100) : 100 - sum;

  return adjusted;
}

export function calculateMacroAdjustment(
  currentTarget: MacroTargetState,
  macro: MacroType,
  value: number,
): MacroTargetState {
  const clampedValue = Math.round(Math.max(5, Math.min(70, value)));
  const targetCopy = { ...currentTarget };
  const macroKey = `${macro}Percentage` as MacroKey;
  targetCopy[macroKey] = clampedValue;

  const isCurrentMacroLocked = targetCopy.lockedMacros.includes(macro);
  const unlockedKeys = getUnlockedMacroKeys(targetCopy, macro);

  const lockedMacrosSum = targetCopy.lockedMacros
    .filter((lockedMacro) => lockedMacro !== macro || !isCurrentMacroLocked)
    .reduce((sum, lockedMacro) => {
      const key = `${lockedMacro}Percentage` as MacroKey;

      return sum + targetCopy[key];
    }, 0);

  const remainingTotal = 100 - clampedValue - lockedMacrosSum;

  if (unlockedKeys.length === 0) {
    if (clampedValue + lockedMacrosSum !== 100 && !isCurrentMacroLocked) {
      targetCopy[macroKey] = Math.max(5, Math.min(70, 100 - lockedMacrosSum));
    }
  } else if (unlockedKeys.length === 1) {
    const singleUnlockedKey = unlockedKeys[0];
    const unlockedValue = Math.round(Math.max(5, Math.min(70, remainingTotal)));

    if (unlockedValue !== remainingTotal) {
      const difference = remainingTotal - unlockedValue;
      targetCopy[macroKey] = Math.max(5, Math.min(70, clampedValue - difference));
    }

    targetCopy[singleUnlockedKey] = unlockedValue;
  } else {
    const currentUnlockedTotal = unlockedKeys.reduce(
      (sum, key) => sum + targetCopy[key],
      0,
    );

    if (currentUnlockedTotal > 0) {
      let distributedTotal = 0;
      for (const key of unlockedKeys) {
        const proportion = targetCopy[key] / currentUnlockedTotal;
        targetCopy[key] = Math.round(
          Math.max(5, Math.min(70, remainingTotal * proportion)),
        );
        distributedTotal += targetCopy[key];
      }

      if (distributedTotal !== remainingTotal) {
        const difference = remainingTotal - distributedTotal;
        const adjustableKey = unlockedKeys.find((key) => {
          const currentValue = targetCopy[key];

          return currentValue + difference >= 5 && currentValue + difference <= 70;
        });

        if (adjustableKey) {
          targetCopy[adjustableKey] += difference;
        } else if (difference < 0) {
          targetCopy[macroKey] = Math.max(5, targetCopy[macroKey] + difference);
        }
      }
    } else {
      const perMacro = Math.floor(remainingTotal / unlockedKeys.length);
      let remainder = remainingTotal - perMacro * unlockedKeys.length;

      for (const key of unlockedKeys) {
        targetCopy[key] = perMacro + (remainder > 0 ? 1 : 0);
        remainder--;
      }
    }
  }

  const finalSum =
    targetCopy.proteinPercentage +
    targetCopy.carbsPercentage +
    targetCopy.fatsPercentage;

  if (finalSum !== 100) {
    const adjustableKeys = ([
      "proteinPercentage",
      "carbsPercentage",
      "fatsPercentage",
    ] as MacroKey[])
      .filter((key) => {
        const macroName = key.replace("Percentage", "") as MacroType;

        return !targetCopy.lockedMacros.includes(macroName) || macroName === macro;
      })
      .filter((key) => targetCopy[key] > 5 && targetCopy[key] < 70);

    if (adjustableKeys.length > 0) {
      const preferredKey = macroKey;
      const keyToAdjust = adjustableKeys.includes(preferredKey)
        ? preferredKey
        : adjustableKeys[0];
      targetCopy[keyToAdjust] += 100 - finalSum;
    }
  }

  return targetCopy;
}

export function useMacroTargetCore(
  initialValues: MacroTargetState,
  onChange?: (target: MacroTargetState, shouldPersist?: boolean) => void,
) {
  const [target, setTarget] = useState<MacroTargetState>(initialValues);
  const [isAdjusting, setIsAdjusting] = useState<MacroType | undefined>();

  const handleChange = useCallback(
    (macro: MacroType, value: number) => {
      setIsAdjusting(macro);
      const adjustedTarget = calculateMacroAdjustment(target, macro, value);
      setTarget(adjustedTarget);
      onChange?.(adjustedTarget, true);
      setTimeout(() => setIsAdjusting(undefined), 100);
    },
    [target, onChange],
  );

  const toggleLock = useCallback(
    (macro: MacroType) => {
      const updatedTarget = { ...target };

      if (updatedTarget.lockedMacros.includes(macro)) {
        updatedTarget.lockedMacros = updatedTarget.lockedMacros.filter(
          (lockedMacro) => lockedMacro !== macro,
        );
      } else if (updatedTarget.lockedMacros.length < 2) {
        updatedTarget.lockedMacros = [...updatedTarget.lockedMacros, macro];
      } else {
        return;
      }

      setTarget(updatedTarget);
      onChange?.(updatedTarget, false);
    },
    [target, onChange],
  );

  return {
    target,
    setTarget,
    isAdjusting,
    setIsAdjusting,
    handleChange,
    toggleLock,
  };
}
