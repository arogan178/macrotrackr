// Type definitions
export type Gender = "male" | "female";

// Updated activity types
export type ExerciseFrequency = "none" | "low" | "medium" | "high";
export type NonExerciseActivity = "sedentary" | "moderate" | "very_active";

export type WeightGoal = "lose" | "maintain" | "gain";

export type MacroDistribution = {
  protein: number;
  carbs: number;
  fat: number;
};

// Exercise frequency multipliers
const exerciseMultipliers: Record<ExerciseFrequency, number> = {
  none: 1.0, // 0 times per week
  low: 1.2, // 1-3 times per week
  medium: 1.35, // 4-6 times per week
  high: 1.5, // 7+ times per week
};

// Non-exercise activity multipliers
const nonExerciseMultipliers: Record<NonExerciseActivity, number> = {
  sedentary: 1.2, // Mostly sedentary - less than 5k steps
  moderate: 1.35, // Moderately active - 5k-10k steps
  very_active: 1.5, // Very active - 15k+ steps
};

// Goal-based macro distributions
const macroDistributions: Record<
  WeightGoal,
  { protein: number; fat: number; carbs: number }
> = {
  lose: { protein: 0.4, fat: 0.3, carbs: 0.3 },
  gain: { protein: 0.3, fat: 0.25, carbs: 0.45 },
  maintain: { protein: 0.3, fat: 0.3, carbs: 0.4 },
};

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'male' or 'female'
 * @returns BMR in calories per day
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number {
  if (!weight || !height || !age || !gender) return 0;

  const baseCalculation = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? baseCalculation + 5 : baseCalculation - 161;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on exercise frequency and non-exercise activity
 * @param bmr - Basal Metabolic Rate
 * @param exerciseFrequency - How often the person exercises
 * @param nonExerciseActivity - Activity level outside of structured exercise
 * @returns TDEE in calories per day
 */
export function calculateTDEE(
  bmr: number,
  exerciseFrequency: ExerciseFrequency,
  nonExerciseActivity: NonExerciseActivity
): number {
  if (!bmr) return 0;

  // Get multipliers for both activity types
  const exerciseMultiplier =
    exerciseMultipliers[exerciseFrequency] || exerciseMultipliers.none;
  const nonExerciseMultiplier =
    nonExerciseMultipliers[nonExerciseActivity] ||
    nonExerciseMultipliers.sedentary;

  // Calculate TDEE with weighted average of both multipliers (60% non-exercise, 40% exercise)
  const combinedMultiplier =
    nonExerciseMultiplier * 0.6 + exerciseMultiplier * 0.4;

  return Math.round(bmr * combinedMultiplier);
}

/**
 * Calculates daily calorie goal based on TDEE and weight goal
 * @param tdee - Total Daily Energy Expenditure
 * @param goal - Weight management goal
 * @returns Daily calorie goal
 */
export function calculateCalorieGoal(tdee: number, goal: WeightGoal): number {
  if (!tdee) return 0;

  const adjustmentFactors = {
    lose: 0.8, // 20% deficit
    maintain: 1.0, // no change
    gain: 1.1, // 10% surplus
  };

  return Math.round(tdee * adjustmentFactors[goal]);
}

/**
 * Calculates recommended macronutrient distribution
 * @param calorieGoal - Daily calorie goal
 * @param goal - Weight management goal
 * @returns Object containing protein, carbs and fat in grams
 */
export function calculateMacros(
  calorieGoal: number,
  goal: WeightGoal
): MacroDistribution {
  if (!calorieGoal) return { protein: 0, carbs: 0, fat: 0 };

  const {
    protein: proteinPercentage,
    carbs: carbsPercentage,
    fat: fatPercentage,
  } = macroDistributions[goal] || macroDistributions.maintain;

  // Protein and carbs have 4 calories per gram, fat has 9 calories per gram
  return {
    protein: Math.round((calorieGoal * proteinPercentage) / 4),
    carbs: Math.round((calorieGoal * carbsPercentage) / 4),
    fat: Math.round((calorieGoal * fatPercentage) / 9),
  };
}

/**
 * Calculates full nutrition profile from basic user information
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'male' or 'female'
 * @param exerciseFrequency - How often the person exercises
 * @param nonExerciseActivity - Activity level outside of structured exercise
 * @param goal - Weight management goal
 * @returns Complete nutrition profile with BMR, TDEE, calorie goal and macros
 */
export function calculateNutritionProfile(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  exerciseFrequency: ExerciseFrequency,
  nonExerciseActivity: NonExerciseActivity,
  goal: WeightGoal
) {
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, exerciseFrequency, nonExerciseActivity);
  const calorieGoal = calculateCalorieGoal(tdee, goal);
  const macros = calculateMacros(calorieGoal, goal);

  return {
    bmr,
    tdee,
    calorieGoal,
    macros,
  };
}
