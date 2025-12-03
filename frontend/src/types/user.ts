// User and settings shared types
// Usage example:
// import { UserSettings, Gender, ActivityLevel } from '@/types/user';

// Re-export from userConstants for backwards compatibility
export type {
  ActivityLevel,
  Gender,
  UserNutritionalProfile,
} from "@/utils/userConstants";

// Import Gender type for use in this file
import type { Gender } from "@/utils/userConstants";

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
