export const PRICING = {
  monthly: 3.99,
  yearly: 29.99,
} as const;

// Written as what the reader gets, not as the mechanism that provides it.
// "7-Day Reporting View" and "Save up to 5 Meals" named internal limits and
// listed them as though they were features of the free plan; they are its
// boundary, which is a different thing and the reason anyone upgrades.
export const FREE_PLAN_FEATURES = [
  "Log meals, macros and calories, with no daily cap",
  "Set macro targets and a weight goal",
  "Track your weight over time",
  "See the last 7 days of progress",
  "Keep 5 saved meals for quick logging",
] as const;

export const PRO_PLAN_FEATURES = [
  "See 30 and 90 days, not just the last 7",
  "Trends and insights across the whole range",
  "Unlimited saved meals and habits",
  "Your full history, however far back it goes",
  "Export everything to CSV whenever you want",
] as const;

export interface SharedPlanDefinition {
  id: "free" | "pro";
  name: string;
  description: string;
  features: readonly string[];
}

export const FREE_PLAN_DEFINITION: SharedPlanDefinition = {
  id: "free",
  name: "Free",
  description: "Everything you need to track a day",
  features: FREE_PLAN_FEATURES,
};

export const PRO_PLAN_DEFINITION: SharedPlanDefinition = {
  id: "pro",
  name: "Pro",
  description: "For when a week is not a long enough view",
  features: PRO_PLAN_FEATURES,
};

export const SHARED_PLANS: readonly SharedPlanDefinition[] = [
  FREE_PLAN_DEFINITION,
  PRO_PLAN_DEFINITION,
] as const;

export function getSharedPlanDefinition(id: "free" | "pro") {
  return id === "free" ? FREE_PLAN_DEFINITION : PRO_PLAN_DEFINITION;
}
