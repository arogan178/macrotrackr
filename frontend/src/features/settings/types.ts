// src/features/settings/types.ts (or user/types.ts)

// Single consolidated type for all activity/exercise levels
// NOTE: Backend uses 1-5 numbers. Conversion happens in slice/API service.
export type ActivityLevel = "sedentary" | "low" | "medium" | "high" | "athlete";

export type Gender = "male" | "female";

// Type for macro categories
export type MacroType = "protein" | "carbs" | "fats";

// Represents core user settings / details (camelCase)
export interface UserSettings {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null; // Use null for potentially unset values
  height: number | null;
  weight: number | null;
  activityLevel: number | null; // Store the number (1-5) consistent with backend
  gender: Gender | null;
}

// Represents target MACROS IN GRAMS (if needed for calculations/display)
export type MacroTargetGrams = {
  protein: number;
  carbs: number;
  fats: number;
};

// Represents target MACRO DISTRIBUTION IN PERCENTAGES (camelCase)
// This structure is returned by GET /api/user/me and used in PUT /api/user/settings
export interface MacroTargetPercentages {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  lockedMacros?: Array<MacroType>; // Updated to use the MacroType
}

// Complete state for the MacroTarget component
export interface MacroTargetState extends MacroTargetPercentages {
  lockedMacros: MacroType[]; // Non-optional for internal state
}

// Props for the MacroTarget component
export interface MacroTargetProps {
  initialValues?: MacroTargetState;
  onTargetChange: (target: MacroTargetState) => void;
}

// Represents calculated nutritional info based on UserSettings
// Does NOT include target percentages, assuming those are managed as goals.
export interface UserNutritionalProfile {
  userId: number; // Changed from user_id, linked to UserSettings.id
  bmr: number;
  tdee: number;
}
