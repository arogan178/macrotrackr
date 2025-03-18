// Type definitions
export type Gender = 'male' | 'female';

export enum ActivityLevel {
  Sedentary = 1,
  Light = 2,
  Moderate = 3,
  VeryActive = 4,
  ExtraActive = 5
}

export type WeightGoal = 'lose' | 'maintain' | 'gain';

export type MacroDistribution = {
  protein: number;
  carbs: number;
  fat: number;
};

// Activity level multipliers for TDEE
const activityMultipliers: Record<ActivityLevel, number> = {
  [ActivityLevel.Sedentary]: 1.2,   // Sedentary (little to no exercise)
  [ActivityLevel.Light]: 1.375,     // Light (exercise 1-3 days/week)
  [ActivityLevel.Moderate]: 1.55,   // Moderate (exercise 3-5 days/week)
  [ActivityLevel.VeryActive]: 1.725, // Very Active (exercise 6-7 days/week)
  [ActivityLevel.ExtraActive]: 1.9   // Extra Active (very intense exercise daily)
};

// Goal-based macro distributions
const macroDistributions: Record<WeightGoal, { protein: number, fat: number, carbs: number }> = {
  lose: { protein: 0.4, fat: 0.3, carbs: 0.3 },
  gain: { protein: 0.3, fat: 0.25, carbs: 0.45 },
  maintain: { protein: 0.3, fat: 0.3, carbs: 0.4 }
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
  return gender === 'male' ? baseCalculation + 5 : baseCalculation - 161;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE)
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - Level of physical activity
 * @returns TDEE in calories per day
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel
): number {
  if (!bmr || !activityLevel) return 0;
  
  const multiplier = activityMultipliers[activityLevel] || activityMultipliers[ActivityLevel.Sedentary];
  return Math.round(bmr * multiplier);
}

/**
 * Calculates daily calorie goal based on TDEE and weight goal
 * @param tdee - Total Daily Energy Expenditure
 * @param goal - Weight management goal
 * @returns Daily calorie goal
 */
export function calculateCalorieGoal(
  tdee: number,
  goal: WeightGoal
): number {
  if (!tdee) return 0;
  
  const adjustmentFactors = {
    lose: 0.8,     // 20% deficit
    maintain: 1.0, // no change
    gain: 1.1      // 10% surplus
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
  
  const { protein: proteinPercentage, carbs: carbsPercentage, fat: fatPercentage } = 
    macroDistributions[goal] || macroDistributions.maintain;
  
  // Protein and carbs have 4 calories per gram, fat has 9 calories per gram
  return {
    protein: Math.round((calorieGoal * proteinPercentage) / 4),
    carbs: Math.round((calorieGoal * carbsPercentage) / 4),
    fat: Math.round((calorieGoal * fatPercentage) / 9)
  };
}

/**
 * Calculates full nutrition profile from basic user information
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'male' or 'female'
 * @param activityLevel - Level of physical activity
 * @param goal - Weight management goal
 * @returns Complete nutrition profile with BMR, TDEE, calorie goal and macros
 */
export function calculateNutritionProfile(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: WeightGoal
) {
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const calorieGoal = calculateCalorieGoal(tdee, goal);
  const macros = calculateMacros(calorieGoal, goal);
  
  return {
    bmr,
    tdee,
    calorieGoal,
    macros
  };
}