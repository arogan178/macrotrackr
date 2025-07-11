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
  dateOfBirth: string | undefined;
  height: number | undefined;
  weight: number | undefined;
  activityLevel: number | undefined;
  gender: Gender | undefined;
}

export interface UserNutritionalProfile {
  userId: number;
  bmr: number;
  tdee: number;
}
