import type { WeightGoals } from "@/types/goal";

import type { TimeToGoalCalculation } from "./types";

// Re-export goal calculation functions from centralized utils to maintain single source of truth
export {
  calculateCalorieTarget,
  calculateRecommendedDeficit,
  calculateTimeToGoal,
  calculateWeeklyChange,
  calculateWeeksToGoal,
  generateWeightGoalCalculations,
} from "@/utils/nutritionCalculations";
