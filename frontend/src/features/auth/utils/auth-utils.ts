import { ActivityLevel } from "@/types/user";
import {
  AUTH_ERROR_MESSAGES,
  PASSWORD_VALIDATION,
  HEIGHT_VALIDATION,
  WEIGHT_VALIDATION,
} from "../constants";
import { apiService } from "@/utils/api-service";
import { getErrorMessage } from "@/utils/error-handling";
import { securelyStoreToken, removeToken } from "@/utils/token-storage";

// Types for registration data
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  height: number | undefined;
  weight: number | undefined;
  gender: "male" | "female" | "";
  activityLevel: ActivityLevel | "";
  step: number;
}

export interface AuthStateData {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: RegisterData;
}

// Initial state creators
export function createInitialRegisterData(): RegisterData {
  return {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    height: undefined,
    weight: undefined,
    gender: "",
    activityLevel: "",
    step: 1,
  };
}

export function createInitialAuthState(): AuthStateData {
  return {
    email: "",
    password: "",
    isLoading: false,
    error: null,
    isAuthenticated: false,
    register: createInitialRegisterData(),
  };
}

// Authentication utilities
export async function performLogin(
  email: string,
  password: string
): Promise<string> {
  try {
    const response = await apiService.auth.login(email, password);

    if (!response || !response.token) {
      throw new Error(AUTH_ERROR_MESSAGES.serverError);
    }

    securelyStoreToken(response.token);
    return response.token;
  } catch (err) {
    let errorMessage = getErrorMessage(err);

    if (errorMessage.includes("401") || errorMessage.includes("403")) {
      errorMessage = AUTH_ERROR_MESSAGES.invalidCredentials;
    } else if (errorMessage.includes("network")) {
      errorMessage = AUTH_ERROR_MESSAGES.networkError;
    }

    throw new Error(errorMessage);
  }
}

export function performLogout(): void {
  removeToken();
}

// Registration utilities
export async function validateEmailAvailability(
  email: string
): Promise<boolean> {
  try {
    const { valid } = await apiService.auth.validateEmail(email);

    if (!valid) {
      throw new Error(AUTH_ERROR_MESSAGES.emailInUse);
    }

    return valid;
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    throw new Error(
      `${AUTH_ERROR_MESSAGES.emailValidationFailed}: ${errorMessage}`
    );
  }
}

export async function submitUserRegistration(
  registerData: RegisterData
): Promise<string> {
  try {
    const userData = {
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      email: registerData.email,
      password: registerData.password,
      dateOfBirth: registerData.dateOfBirth,
      height: registerData.height,
      weight: registerData.weight,
      gender: registerData.gender,
      activityLevel: registerData.activityLevel,
    };

    const response = await apiService.auth.register(userData);

    if (!response || !response.token) {
      throw new Error(AUTH_ERROR_MESSAGES.serverError);
    }

    securelyStoreToken(response.token);
    return response.token;
  } catch (err) {
    let errorMessage = getErrorMessage(err);

    if (
      errorMessage.includes("email") ||
      errorMessage.includes("already exists")
    ) {
      errorMessage = AUTH_ERROR_MESSAGES.emailExists;
    } else if (errorMessage.includes("password")) {
      errorMessage = AUTH_ERROR_MESSAGES.passwordWeak;
    }

    throw new Error(errorMessage);
  }
}

// State update utilities
export function updateRegisterField<K extends keyof Omit<RegisterData, "step">>(
  currentRegister: RegisterData,
  field: K,
  value: RegisterData[K]
): RegisterData {
  return {
    ...currentRegister,
    [field]: value,
  };
}

export function updateRegisterStep(
  currentRegister: RegisterData,
  step: number
): RegisterData {
  return {
    ...currentRegister,
    step,
  };
}

export function resetRegisterData(): RegisterData {
  return createInitialRegisterData();
}

// Progress calculation utilities
export function calculateStepProgress(
  currentStep: number,
  totalSteps: number
): number {
  if (currentStep === 1) return 0;
  return ((currentStep - 1) / (totalSteps - 1)) * 100;
}

export function isStepComplete(
  stepNumber: number,
  currentStep: number
): boolean {
  return stepNumber < currentStep;
}

export function isCurrentStep(
  stepNumber: number,
  currentStep: number
): boolean {
  return stepNumber === currentStep;
}

// Form field validation helpers
export function validatePasswordStrength(password: string): boolean {
  return (
    password.length >= PASSWORD_VALIDATION.minLength &&
    password.length <= PASSWORD_VALIDATION.maxLength
  );
}

export function validateHeightRange(height: number | undefined): boolean {
  if (!height) return false;
  return height >= HEIGHT_VALIDATION.min && height <= HEIGHT_VALIDATION.max;
}

export function validateWeightRange(weight: number | undefined): boolean {
  if (!weight) return false;
  return weight >= WEIGHT_VALIDATION.min && weight <= WEIGHT_VALIDATION.max;
}

export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
}

// Step navigation utilities
export function canProceedToNextStep(
  currentStep: number,
  totalSteps: number
): boolean {
  return currentStep < totalSteps;
}

export function canGoToPreviousStep(currentStep: number): boolean {
  return currentStep > 1;
}

export function getNextStep(currentStep: number, totalSteps: number): number {
  return canProceedToNextStep(currentStep, totalSteps)
    ? currentStep + 1
    : currentStep;
}

export function getPreviousStep(currentStep: number): number {
  return canGoToPreviousStep(currentStep) ? currentStep - 1 : currentStep;
}
