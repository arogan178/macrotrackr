import type { WeightGoals } from "@/types/goal";
import type { TimeToGoalCalculation } from "./types";

// Re-export goal calculation functions from centralized utils to maintain single source of truth
export {
 calculateTimeToGoal,
 calculateRecommendedDeficit,
 calculateWeeklyChange,
 calculateCalorieTarget,
 calculateWeeksToGoal,
 generateWeightGoalCalculations,
} from "@/utils/nutritionCalculations";
