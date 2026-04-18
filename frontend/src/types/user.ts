// User and settings shared types
// Usage example:
// import { UserSettings, Gender, ActivityLevel } from '@/types/user';

import type { Gender } from "./activity";

export type { ActivityLevel, Gender } from "./activity";
export type { UserNutritionalProfile } from "@/utils/userConstants";

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
