// User and settings shared types
// Usage example:
// import { UserSettings, Gender, ActivityLevel } from '@/types/user';

import { GENDER_OPTIONS, type ActivityLevel } from "@/utils/userConstants";

export type { ActivityLevel };
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
  subscription?: {
    status: "free" | "pro" | "canceled";
    hasStripeCustomer: boolean;
    currentPeriodEnd: string | undefined;
  };
}

export interface UserNutritionalProfile {
  userId: number;
  bmr: number;
  tdee: number;
}
