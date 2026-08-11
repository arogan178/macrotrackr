import type { MacroType } from "@/types/macro";

export interface MacroPercentages {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

/**
 * Adjusts macro percentages when one slider moves, keeping the sum at 100.
 * Redistributes difference proportionally among unlocked remaining macros.
 */
export function redistributeMacroPercentages(
  changedMacro: MacroType,
  newValue: number,
  current: MacroPercentages,
  lockedMacros: MacroType[] = [],
): MacroPercentages {
  // If the macro being changed is itself locked, return current unchanged
  if (lockedMacros.includes(changedMacro)) {
    return current;
  }

  const keyMap: Record<MacroType, keyof MacroPercentages> = {
    protein: "proteinPercentage",
    carbs: "carbsPercentage",
    fats: "fatsPercentage",
  };

  const changedKey = keyMap[changedMacro];
  const otherMacros = (["protein", "carbs", "fats"] as const).filter(
    (m) => m !== changedMacro,
  );

  const unlockedOthers = otherMacros.filter((m) => !lockedMacros.includes(m));

  // If no other macros can absorb changes, return current unchanged
  if (unlockedOthers.length === 0) {
    return current;
  }

  // Calculate sum of locked other macros
  const lockedOthersSum = otherMacros
    .filter((m) => lockedMacros.includes(m))
    .reduce((sum, m) => sum + current[keyMap[m]], 0);

  const maxAllowed = Math.max(0, 100 - lockedOthersSum);
  const clampedValue = Math.max(0, Math.min(maxAllowed, Math.round(newValue)));

  const remaining = 100 - clampedValue - lockedOthersSum;

  if (unlockedOthers.length === 1) {
    const singleOtherKey = keyMap[unlockedOthers[0]];

    return {
      ...current,
      [changedKey]: clampedValue,
      [singleOtherKey]: Math.max(0, remaining),
    };
  }

  // Both other macros are unlocked
  const currentOtherSum =
    current[keyMap[unlockedOthers[0]]] + current[keyMap[unlockedOthers[1]]];

  let firstValue: number;
  let secondValue: number;

  if (currentOtherSum === 0) {
    firstValue = Math.floor(remaining / 2);
    secondValue = remaining - firstValue;
  } else {
    const ratio0 = current[keyMap[unlockedOthers[0]]] / currentOtherSum;
    firstValue = Math.round(remaining * ratio0);
    secondValue = remaining - firstValue;
  }

  return {
    ...current,
    [changedKey]: clampedValue,
    [keyMap[unlockedOthers[0]]]: Math.max(0, firstValue),
    [keyMap[unlockedOthers[1]]]: Math.max(0, secondValue),
  };
}
