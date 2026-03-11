import { useEffect } from "react";

import {
  balanceMacroPercentages,
  useMacroTargetCore,
} from "@/features/macroTracking/hooks/useMacroTargetCore";
import type { MacroTargetState } from "@/types/macro";

export function useMacroTarget(
  initialValues: MacroTargetState,
  onChange?: (target: MacroTargetState, shouldPersist?: boolean) => void,
) {
  const hook = useMacroTargetCore(initialValues, onChange);

  useEffect(() => {
    if (!hook.isAdjusting) {
      hook.setTarget(initialValues);
    }
  }, [initialValues, hook.isAdjusting, hook.setTarget]);

  useEffect(() => {
    if (!hook.isAdjusting) {
      const sum =
        hook.target.proteinPercentage +
        hook.target.carbsPercentage +
        hook.target.fatsPercentage;

      if (sum !== 100) {
        const adjusted = balanceMacroPercentages(hook.target);
        hook.setTarget(adjusted);
        onChange?.(adjusted, false);
      }
    }
  }, [hook.isAdjusting, hook.target, hook.setTarget, onChange]);

  return {
    target: hook.target,
    isAdjusting: hook.isAdjusting,
    handleChange: hook.handleChange,
    toggleLock: hook.toggleLock,
  };
}
