import {
  USER_MINIMUM_AGE,
  USER_MINIMUM_HEIGHT,
  USER_MAXIMUM_HEIGHT,
  USER_MINIMUM_WEIGHT,
  USER_MAXIMUM_WEIGHT,
} from "@/utils/constants";
import { isOldEnough } from "@/utils/validation";
import type { UserSettings } from "../types/types";
import type { MacroTargetSettings } from "@/types/macro";
/**
 * Validates user form fields
 */
export function validateUserSettings(settings: any): Record<string, string> {
  const errors: Record<string, string> = {};

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (settings?.email && !emailRegex.test(settings.email)) {
    errors.email = "Please enter a valid email address";
  }

  // Name validation
  if (settings?.firstName && settings.firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters";
  }

  // Date of birth validation
  if (settings?.dateOfBirth) {
    if (!isOldEnough(settings.dateOfBirth)) {
      errors.dateOfBirth = `You must be at least ${USER_MINIMUM_AGE} years old`;
    }
  }

  // Height validation
  if (
    settings?.height &&
    (settings.height < USER_MINIMUM_HEIGHT ||
      settings.height > USER_MAXIMUM_HEIGHT)
  ) {
    errors.height = `Please enter a valid height (${USER_MINIMUM_HEIGHT}-${USER_MAXIMUM_HEIGHT} cm)`;
  }

  // Weight validation
  if (
    settings?.weight &&
    (settings.weight < USER_MINIMUM_WEIGHT ||
      settings.weight > USER_MAXIMUM_WEIGHT)
  ) {
    errors.weight = `Please enter a valid weight (${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`;
  }

  return errors;
}

// Helper function to validate user settings with required fields
export const validateSettingsComplete = (
  settings: UserSettings | null,
): Record<string, string> => {
  if (!settings) {
    return { general: "Settings data is required" };
  }

  // Use the comprehensive validation
  const errors = validateUserSettings(settings);

  // Add required field validation
  if (!settings.firstName) errors.firstName = "First name required";
  if (!settings.lastName) errors.lastName = "Last name required";
  if (!settings.email) errors.email = "Email required";

  return errors;
};

// Helper function to check if settings have changed
export const hasSettingsChanged = (
  current: UserSettings | null,
  original: UserSettings | null,
): boolean => {
  if (!current || !original) return current !== original;
  return JSON.stringify(current) !== JSON.stringify(original);
};

// Helper function to check if macro targets have changed
export const hasMacroTargetsChanged = (
  current: MacroTargetSettings | null,
  original: MacroTargetSettings | null,
): boolean => {
  if (!current || !original) return current !== original;
  return JSON.stringify(current) !== JSON.stringify(original);
};
