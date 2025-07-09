import { ActivityLevel, Gender } from "@/types/user";

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
  gender: Gender | "";
}

export interface RegistrationStep3 {
  activityLevel: ActivityLevel;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

// Combined registration data type
export interface RegistrationData
  extends RegistrationStep1,
  RegistrationStep2,
  RegistrationStep3 {}
