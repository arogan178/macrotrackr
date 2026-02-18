// backend/tests/contracts/schemas.ts
// Contract schema definitions and type guards for API responses

// ============================================================================
// Macro Target Response
// GET /api/macros/target
// ============================================================================

export interface MacroTarget {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  lockedMacros: ("protein" | "carbs" | "fats")[];
}

export interface MacroTargetResponse {
  macroTarget: MacroTarget;
}

export function isValidMacroTarget(data: unknown): data is MacroTarget {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.proteinPercentage === "number" &&
    typeof obj.carbsPercentage === "number" &&
    typeof obj.fatsPercentage === "number" &&
    Array.isArray(obj.lockedMacros) &&
    obj.lockedMacros.every(
      (item) => ["protein", "carbs", "fats"].includes(item)
    )
  );
}

export function isValidMacroTargetResponse(data: unknown): data is MacroTargetResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.macroTarget === "object" &&
    obj.macroTarget !== null &&
    isValidMacroTarget(obj.macroTarget)
  );
}

// ============================================================================
// Macro Totals Response
// GET /api/macros/totals
// ============================================================================

export interface MacroTotalsResponse {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export function isValidMacroTotalsResponse(data: unknown): data is MacroTotalsResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.protein === "number" &&
    typeof obj.carbs === "number" &&
    typeof obj.fats === "number" &&
    typeof obj.calories === "number"
  );
}

// ============================================================================
// Macro Entry Response
// POST /api/macros, PUT /api/macros/:id
// ============================================================================

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MacroEntryResponse {
  id: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName?: string;
  entryDate: string;
  entryTime: string;
  createdAt: string;
}

export function isValidMealType(value: unknown): value is MealType {
  return ["breakfast", "lunch", "dinner", "snack"].includes(value as string);
}

export function isValidMacroEntryResponse(data: unknown): data is MacroEntryResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === "number" &&
    typeof obj.protein === "number" &&
    typeof obj.carbs === "number" &&
    typeof obj.fats === "number" &&
    isValidMealType(obj.mealType) &&
    (obj.mealName === undefined || typeof obj.mealName === "string") &&
    typeof obj.entryDate === "string" &&
    typeof obj.entryTime === "string" &&
    typeof obj.createdAt === "string"
  );
}

// ============================================================================
// Macro History Response
// GET /api/macros/history
// ============================================================================

export interface MacroHistoryResponse {
  entries: MacroEntryResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function isValidMacroHistoryResponse(data: unknown): data is MacroHistoryResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    Array.isArray(obj.entries) &&
    obj.entries.every(isValidMacroEntryResponse) &&
    typeof obj.total === "number" &&
    typeof obj.limit === "number" &&
    typeof obj.offset === "number" &&
    typeof obj.hasMore === "boolean"
  );
}

// ============================================================================
// Weight Goal Response
// GET /api/goals/weight
// ============================================================================

export type WeightGoalType = "lose" | "maintain" | "gain";

export interface WeightGoalResponse {
  startingWeight: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  weightGoal: WeightGoalType | null;
  startDate: string | null;
  targetDate: string | null;
  calorieTarget: number | null;
  calculatedWeeks: number | null;
  weeklyChange: number | null;
  dailyChange: number | null;
}

export function isValidWeightGoalType(value: unknown): value is WeightGoalType {
  return ["lose", "maintain", "gain"].includes(value as string);
}

export function isValidWeightGoalResponse(data: unknown): data is WeightGoalResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  // Check nullable number fields
  const nullableNumberFields = [
    "startingWeight",
    "currentWeight",
    "targetWeight",
    "calorieTarget",
    "calculatedWeeks",
    "weeklyChange",
    "dailyChange",
  ];
  
  for (const field of nullableNumberFields) {
    const value = obj[field];
    if (value !== null && typeof value !== "number") {
      return false;
    }
  }
  
  // Check nullable string fields
  const nullableStringFields = ["startDate", "targetDate"];
  for (const field of nullableStringFields) {
    const value = obj[field];
    if (value !== null && typeof value !== "string") {
      return false;
    }
  }
  
  // Check weightGoal field
  const weightGoal = obj.weightGoal;
  if (weightGoal !== null && !isValidWeightGoalType(weightGoal)) {
    return false;
  }
  
  return true;
}

// ============================================================================
// Weight Log Response
// GET /api/goals/weight-log
// ============================================================================

export interface WeightLogEntry {
  id: string;
  timestamp: string;
  weight: number;
}

export function isValidWeightLogEntry(data: unknown): data is WeightLogEntry {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === "string" &&
    typeof obj.timestamp === "string" &&
    typeof obj.weight === "number"
  );
}

export type WeightLogResponse = WeightLogEntry[];

export function isValidWeightLogResponse(data: unknown): data is WeightLogResponse {
  return Array.isArray(data) && data.every(isValidWeightLogEntry);
}

// ============================================================================
// User Profile Response
// GET /api/user/me
// ============================================================================

export type Gender = "male" | "female";
export type SubscriptionStatus = "free" | "pro" | "canceled";

export interface UserSubscription {
  status: SubscriptionStatus;
  hasStripeCustomer: boolean;
  currentPeriodEnd?: string | null;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  gender: Gender | null;
  activityLevel: number | null;
  isProfileComplete: boolean;
  subscription: UserSubscription;
}

export function isValidSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return ["free", "pro", "canceled"].includes(value as string);
}

export function isValidGender(value: unknown): value is Gender {
  return ["male", "female"].includes(value as string);
}

export function isValidUserSubscription(data: unknown): data is UserSubscription {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  return (
    isValidSubscriptionStatus(obj.status) &&
    typeof obj.hasStripeCustomer === "boolean" &&
    (obj.currentPeriodEnd === undefined ||
      obj.currentPeriodEnd === null ||
      typeof obj.currentPeriodEnd === "string")
  );
}

export function isValidUserProfileResponse(data: unknown): data is UserProfileResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  // Check required fields
  if (
    typeof obj.id !== "number" ||
    typeof obj.email !== "string" ||
    typeof obj.firstName !== "string" ||
    typeof obj.lastName !== "string" ||
    typeof obj.createdAt !== "string" ||
    typeof obj.isProfileComplete !== "boolean"
  ) {
    return false;
  }
  
  // Check nullable fields
  if (obj.dateOfBirth !== null && typeof obj.dateOfBirth !== "string") {
    return false;
  }
  if (obj.height !== null && typeof obj.height !== "number") {
    return false;
  }
  if (obj.weight !== null && typeof obj.weight !== "number") {
    return false;
  }
  if (obj.gender !== null && !isValidGender(obj.gender)) {
    return false;
  }
  if (obj.activityLevel !== null && typeof obj.activityLevel !== "number") {
    return false;
  }
  
  // Check subscription object
  if (!isValidUserSubscription(obj.subscription)) {
    return false;
  }
  
  return true;
}

// ============================================================================
// Helper function to validate date format (YYYY-MM-DD)
// ============================================================================

export function isValidDateString(value: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return false;
  
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// ============================================================================
// Helper function to validate time format (HH:MM or HH:MM:SS)
// ============================================================================

export function isValidTimeString(value: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
  return timeRegex.test(value);
}

// ============================================================================
// Helper function to validate ISO 8601 datetime format
// ============================================================================

export function isValidISODateTimeString(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}
