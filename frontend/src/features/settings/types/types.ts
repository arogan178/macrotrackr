/**
 * Type definitions for macro targets and distribution management
 */

// Import shared ActivityLevel type


// Re-export for backwards compatibility


export type Gender = "male" | "female";

// Represents core user settings / details (camelCase)
export interface UserSettings {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | undefined; // Use undefined for potentially unset values
  height: number | undefined;
  weight: number | undefined;
  activityLevel: number | undefined; // Store the number (1-5) consistent with backend
  gender: Gender | undefined;
}

// Represents calculated nutritional info based on UserSettings
// Does NOT include target percentages, assuming those are managed as goals.
export interface UserNutritionalProfile {
  userId: number; // Changed from user_id, linked to UserSettings.id
  bmr: number;
  tdee: number;
}

export {type ActivityLevel} from "@/utils/userConstants";