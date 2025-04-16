import { useMemo } from "react";
import { Target, TrendingUp, Calendar } from "lucide-react";

/**
 * Custom hook to provide mock goal data
 * In a real application, this would fetch data from an API
 */
function useGoalData() {
  const goalData = useMemo(() => ({
    weightGoal: {
      current: 72.5,
      target: 68.0,
      progress: 60,
      startDate: "Jan 15, 2025",
      targetDate: "Apr 30, 2025",
    },

    calorieGoal: {
      daily: 1830,
      current: 1200,
    },

    macroGoals: {
      protein: { value: 78, unit: "g", current: 65 },
      carbs: { value: 160, unit: "g", current: 120 },
      fats: { value: 65, unit: "g", current: 52 },
    },

    streakGoals: [
      {
        id: 1,
        name: "Logging streak",
        current: 7,
        target: 30,
        icon: Calendar,
        progress: 23,
      },
      {
        id: 2,
        name: "Macro goals hit",
        current: 5,
        target: 7,
        icon: Target,
        progress: 71,
      },
      {
        id: 3,
        name: "Weekly weigh-ins",
        current: 4,
        target: 4,
        icon: TrendingUp,
        progress: 100,
      },
    ],

    achievedGoals: [
      { id: 1, name: "First 5-day streak", date: "Mar 12, 2025", icon: Calendar },
      {
        id: 2,
        name: "Hit protein goal 7 days in a row",
        date: "Mar 5, 2025",
        icon: Target,
      },
      {
        id: 3,
        name: "Lost first kilogram",
        date: "Feb 20, 2025",
        icon: TrendingUp,
      },
    ],
  }), []);

  return goalData;
}

export { useGoalData };