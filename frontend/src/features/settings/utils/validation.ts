import { USER_MINIMUM_AGE } from "@/utils/constants";
import { isOldEnough } from "@/utils/validation";

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
  if (settings?.height && (settings.height < 120 || settings.height > 250)) {
    errors.height = "Please enter a valid height (120-250 cm)";
  }

  // Weight validation
  if (settings?.weight && (settings.weight < 30 || settings.weight > 300)) {
    errors.weight = "Please enter a valid weight (30-300 kg)";
  }

  return errors;
}
