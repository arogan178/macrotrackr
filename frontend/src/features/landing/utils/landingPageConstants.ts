import {
  BarChartIcon,
  NutrientIcon,
  SearchIcon,
  TargetIcon,
  TrendingUpIcon,
  WeightIcon,
} from "@/components/ui";

/**
 * Features shown on the landing page. Each one names something the app
 * actually does — claims here are load-bearing.
 */
export const FEATURES = [
  {
    name: "Macro Tracking",
    description:
      "Log protein, carbs and fats. Calories are calculated for you.",
    icon: NutrientIcon,
  },
  {
    name: "Food Search",
    description: "Search a food database and pull in its macros per serving.",
    icon: SearchIcon,
  },
  {
    name: "Goal Setting",
    description:
      "Set a target weight and get the daily calorie target that reaches it.",
    icon: TargetIcon,
  },
  {
    name: "Custom Macro Targets",
    description: "Set your own protein, carb and fat split.",
    icon: BarChartIcon,
  },
  {
    name: "Weight & Habits",
    description: "Log your weight and daily habits, and keep a streak going.",
    icon: WeightIcon,
  },
  {
    name: "Progress Insights",
    description:
      "See your averages, trends and tracked days over any date range.",
    icon: TrendingUpIcon,
  },
];

