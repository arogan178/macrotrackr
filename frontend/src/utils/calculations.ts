// Mifflin-St Jeor Equation for BMR
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number => {
  if (!weight || !height || !age || !gender) return 0;

  // BMR Formula:
  // Male: 10 × weight + 6.25 × height - 5 × age + 5
  // Female: 10 × weight + 6.25 × height - 5 × age - 161
  const baseCalculation = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? baseCalculation + 5 : baseCalculation - 161;
};

// Activity level multipliers for TDEE
const activityMultipliers = {
  1: 1.2,  // Sedentary
  2: 1.375, // Light
  3: 1.55,  // Moderate
  4: 1.725, // Very Active
  5: 1.9    // Extra Active
};

export const calculateTDEE = (
  bmr: number,
  activityLevel: number
): number => {
  if (!bmr || !activityLevel) return 0;
  return Math.round(bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2));
};