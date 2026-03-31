import type { UserDetailsResponse } from "@/api/user";
import type { WeightGoalsResponse } from "@/features/goals/types";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useWeightGoals } from "@/hooks/queries/useGoals";
import { useHabits } from "@/hooks/queries/useHabits";
import { useMacroDailyTotals, useMacroTarget } from "@/hooks/queries/useMacroQueries";
import type { UserSettings } from "@/types/user";
import { DEFAULT_MACRO_TOTALS } from "@/utils/constants/nutrition";
import { createNutritionProfile } from "@/utils/userConstants";

const toUserSettings = (user: UserDetailsResponse | null | undefined): UserSettings | undefined => {
  if (!user) return undefined;

  const gender =
    user.gender === "male" || user.gender === "female"
      ? user.gender
      : "";

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dateOfBirth: user.dateOfBirth ?? "",
    height: user.height,
    weight: user.weight,
    activityLevel: user.activityLevel,
    gender,
    subscription: user.subscription,
  };
};

export function useGoalsData() {
  const { data: user, isError: isUserError, error: userError } = useUser();
  const safeUserSettings = toUserSettings(user);

  const { data: macroTarget } = useMacroTarget();
  const { data: liveMacroDailyTotals } = useMacroDailyTotals();

  const macroDailyTotals = liveMacroDailyTotals ?? DEFAULT_MACRO_TOTALS;
  const nutritionProfile =
    safeUserSettings &&
    (safeUserSettings.gender === "male" || safeUserSettings.gender === "female")
      ? createNutritionProfile({
          id: safeUserSettings.id,
          weight: safeUserSettings.weight,
          height: safeUserSettings.height,
          dateOfBirth: safeUserSettings.dateOfBirth,
          gender: safeUserSettings.gender,
          activityLevel: safeUserSettings.activityLevel,
        })
      : undefined;

  const {
    data: habits = [],
    isLoading: habitsLoading,
    isError: isHabitsError,
    error: habitsError,
  } = useHabits();

  const {
    data: weightGoalsFromQuery,
    isError: isWeightGoalsError,
    error: weightGoalsError,
  } = useWeightGoals();

  const currentWeightGoals = weightGoalsFromQuery as WeightGoalsResponse | null | undefined;

  const hasErrors = isUserError || isWeightGoalsError || isHabitsError;
  const errors = {
    user: isUserError ? userError : null,
    weightGoals: isWeightGoalsError ? weightGoalsError : null,
    habits: isHabitsError ? habitsError : null,
  };

  return {
    user,
    safeUserSettings,
    macroTarget,
    macroDailyTotals,
    nutritionProfile,
    habits,
    habitsLoading,
    currentWeightGoals,
    hasErrors,
    errors,
  };
}
