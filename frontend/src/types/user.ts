// User and settings shared types
// Usage example:
// import { UserSettings, Gender, ActivityLevel } from '@/types/user';

import { GENDER_OPTIONS } from "@/features/settings/utils/constants";

export type ActivityLevel = "sedentary" | "low" | "medium" | "high" | "athlete";
export type Gender = (typeof GENDER_OPTIONS)[number]["value"];

export interface UserSettings {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  activityLevel: number | null;
  gender: Gender | null;
}

export interface UserNutritionalProfile {
  userId: number;
  bmr: number;
  tdee: number;
}
