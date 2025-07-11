// Common nutrition calculation utilities
export const CALORIE_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9,
};

/**
 * Calculate calories from macronutrients
 */
export function calculateCalories(
  protein: number,
  carbs: number,
  fats: number,
): number {
  return Math.round(
    protein * CALORIE_PER_GRAM.protein +
      carbs * CALORIE_PER_GRAM.carbs +
      fats * CALORIE_PER_GRAM.fats,
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
    ((protein * CALORIE_PER_GRAM.protein) / totalCalories) * 100,
  );
  const carbsPercent = Math.round(
    ((carbs * CALORIE_PER_GRAM.carbs) / totalCalories) * 100,
  );
  const fatsPercent = Math.round(
    ((fats * CALORIE_PER_GRAM.fats) / totalCalories) * 100,
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
    (totalCalories * (proteinPercentage / 100)) / CALORIE_PER_GRAM.protein,
  );
  const carbsTarget = Math.round(
    (totalCalories * (carbsPercentage / 100)) / CALORIE_PER_GRAM.carbs,
  );
  const fatsTarget = Math.round(
    (totalCalories * (fatsPercentage / 100)) / CALORIE_PER_GRAM.fats,
  );

  return { proteinTarget, carbsTarget, fatsTarget };
}
