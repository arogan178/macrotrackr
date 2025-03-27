// Import the ActivityLevel type from settings
import { ActivityLevel, Gender } from "@/features/settings/types";

export interface RegistrationStep1 {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegistrationStep2 {
  dateOfBirth: string;
  height: number;
  weight: number;
  gender: Gender;
}

export interface RegistrationStep3 {
  activityLevel: ActivityLevel;
}

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

// Combined registration data type
export interface RegistrationData
  extends RegistrationStep1,
    RegistrationStep2,
    RegistrationStep3 {}
