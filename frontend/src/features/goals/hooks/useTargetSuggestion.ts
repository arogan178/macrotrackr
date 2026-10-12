import { useState } from "react";
import type { ExpenditureResult } from "@shared/expenditure";

import { useUpdateWeightGoal } from "@/hooks/queries/useGoals";
import { formatGrouped } from "@/lib/formatNumber";
import { useStore } from "@/store/store";
import type { WeightGoals } from "@/types/goal";
import { todayISO } from "@/utils/dateUtilities";

import {
  isoWeek,
  suggestionDismissKey,
  suggestTarget,
} from "../utils/suggestedTarget";

interface TargetSuggestionInput {
  expenditure: ExpenditureResult | undefined;
  goals: WeightGoals | undefined;
  bmr: number;
  tdee: number;
  userId: number | undefined;
}

export function useTargetSuggestion({
  expenditure,
  goals,
  bmr,
  tdee,
  userId,
}: TargetSuggestionInput) {
  const updateWeightGoal = useUpdateWeightGoal();
  const { showNotification } = useStore();
  const [dismissedKey, setDismissedKey] = useState<string>();

  const key =
    userId === undefined
      ? undefined
      : suggestionDismissKey(userId, isoWeek(todayISO()));
  const dismissed =
    key !== undefined &&
    (dismissedKey === key || globalThis.localStorage?.getItem(key) === "1");

  const suggestion =
    expenditure?.status === "measured" && goals && !dismissed
      ? suggestTarget({ measuredEstimate: expenditure.estimate, goals, bmr })
      : null;

  function dismiss() {
    if (key === undefined) return;
    globalThis.localStorage?.setItem(key, "1");
    setDismissedKey(key);
  }

  async function accept() {
    if (!suggestion || !goals) return;
    try {
      await updateWeightGoal.mutateAsync({
        goals: {
          targetWeight: goals.targetWeight,
          weightGoal: goals.weightGoal,
          startDate: goals.startDate,
          targetDate: goals.targetDate,
          weeklyChange: goals.weeklyChange,
          calculatedWeeks: goals.calculatedWeeks,
          dailyChange: goals.dailyChange,
          calorieTarget: suggestion.target,
        },
        tdee,
      });
      showNotification(
        `Calorie target set to ${formatGrouped(suggestion.target)} kcal`,
        "success",
      );
    } catch {
      showNotification(
        "Could not update your calorie target. Please try again.",
        "error",
      );
    }
  }

  return {
    suggestion,
    isSaving: updateWeightGoal.isPending,
    accept,
    dismiss,
  };
}
