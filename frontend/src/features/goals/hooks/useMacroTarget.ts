import { useEffect } from "react";

import {
  balanceMacroPercentages,
  useMacroTargetCore,
} from "@/features/macroTracking/hooks/useMacroTargetCore";
import type { MacroTargetState } from "@/types/macro";

export function useEditableMacroTarget(
  initialValues: MacroTargetState,
  onChange?: (target: MacroTargetState, shouldPersist?: boolean) => void,
) {
  const {
    target,
    isAdjusting,
    setTarget,
    handleChange,
    toggleLock,
  } = useMacroTargetCore(initialValues, onChange);

  useEffect(() => {
    if (!isAdjusting) {
      setTarget(initialValues);
    }
  }, [initialValues, isAdjusting, setTarget]);

  useEffect(() => {
    if (!isAdjusting) {
      const sum =
        target.proteinPercentage +
        target.carbsPercentage +
        target.fatsPercentage;

      if (sum !== 100) {
        const adjusted = balanceMacroPercentages(target);
        setTarget(adjusted);
        onChange?.(adjusted, false);
      }
    }
  }, [isAdjusting, target, setTarget, onChange]);

  return {
    target,
    isAdjusting,
    handleChange,
    toggleLock,
  };
}
