export const PRICING = {
  monthly: 3.99,
  yearly: 29.99,
} as const;

export const FREE_PLAN_FEATURES = [
  "Macro Tracking",
  "Meal Types & Time Logging",
  "Weight Logging",
  "Basic Goal Setting",
  "7-Day Reporting View",
  "60-Day Entry History",
  "Save up to 5 Meals",
] as const;

export const PRO_PLAN_FEATURES = [
  "Everything in Free, plus:",
  "Unlimited Habit Tracking",
  "Unlimited Meal Saver",
  "30 & 90-Day Reporting",
  "Unlimited Entry History",
  "Advanced Analytics & Insights",
  "CSV Data Export",
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
  description: "Perfect for getting started",
  features: FREE_PLAN_FEATURES,
};

export const PRO_PLAN_DEFINITION: SharedPlanDefinition = {
  id: "pro",
  name: "Pro",
  description: "Unlock your full potential",
  features: PRO_PLAN_FEATURES,
};

export const SHARED_PLANS: readonly SharedPlanDefinition[] = [
  FREE_PLAN_DEFINITION,
  PRO_PLAN_DEFINITION,
] as const;

export function getSharedPlanDefinition(id: "free" | "pro") {
  return id === "free" ? FREE_PLAN_DEFINITION : PRO_PLAN_DEFINITION;
}
