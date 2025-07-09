/**
 * Type definitions for macro targets and distribution management
 */

// Single consolidated type for all activity/exercise levels
// NOTE: Backend uses 1-5 numbers. Conversion happens in slice/API service.
export type ActivityLevel = "sedentary" | "low" | "medium" | "high" | "athlete";

export type Gender = "male" | "female";

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

// Represents calculated nutritional info based on UserSettings
// Does NOT include target percentages, assuming those are managed as goals.
export interface UserNutritionalProfile {
  userId: number; // Changed from user_id, linked to UserSettings.id
  bmr: number;
  tdee: number;
}
