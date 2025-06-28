// Goal-related shared constants
// Usage example:
// import { CALORIE_ADJUSTMENT_FACTORS, WEIGHT_GOAL_OPTIONS } from '@/utils/constants/goal';

export const CALORIE_ADJUSTMENT_FACTORS = {
  lose: -500,
  maintain: 0,
  gain: 300,
} as const;

export const WEIGHT_GOAL_OPTIONS = [
  { value: "lose", label: "Lose Weight", color: "text-red-400" },
  { value: "maintain", label: "Maintain Weight", color: "text-blue-400" },
  { value: "gain", label: "Gain Weight", color: "text-green-400" },
] as const;
