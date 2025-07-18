import { CALORIES_PER_GRAM } from "@/utils/constants/nutrition";

/**
 * Calculate calories from macronutrients
 */
export function calculateCalories(
  protein: number,
  carbs: number,
  fats: number,
): number {
  return Math.round(
    protein * CALORIES_PER_GRAM.protein +
      carbs * CALORIES_PER_GRAM.carbs +
      fats * CALORIES_PER_GRAM.fats,
  );
}

/**
 * Calculate macronutrient percentages from gram values
 */
export function calculateCaloriePercentages(
  protein: number,
  carbs: number,
  fats: number,
) {
  const totalCalories = calculateCalories(protein, carbs, fats);

  // Prevent division by zero
  if (totalCalories === 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatsPercent: 0 };
  }

  const proteinPercent = Math.round(
    ((protein * CALORIES_PER_GRAM.protein) / totalCalories) * 100,
  );
  const carbsPercent = Math.round(
    ((carbs * CALORIES_PER_GRAM.carbs) / totalCalories) * 100,
  );
  const fatsPercent = Math.round(
    ((fats * CALORIES_PER_GRAM.fats) / totalCalories) * 100,
  );

  return { proteinPercent, carbsPercent, fatsPercent };
}

/**
 * Calculate macronutrient target based on total calories and target percentages
 */
export function calculateMacroTarget(
  totalCalories: number,
  proteinPercentage: number,
  carbsPercentage: number,
  fatsPercentage: number,
) {
  const proteinTarget = Math.round(
    (totalCalories * (proteinPercentage / 100)) / CALORIES_PER_GRAM.protein,
  );
  const carbsTarget = Math.round(
    (totalCalories * (carbsPercentage / 100)) / CALORIES_PER_GRAM.carbs,
  );
  const fatsTarget = Math.round(
    (totalCalories * (fatsPercentage / 100)) / CALORIES_PER_GRAM.fats,
  );

  return { proteinTarget, carbsTarget, fatsTarget };
}
