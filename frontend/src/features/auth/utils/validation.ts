import { USER_MINIMUM_AGE } from "@/utils/constants";
import { isOldEnough } from "@/utils/validation";
import {
  RegistrationStep1,
  RegistrationStep2,
  RegistrationStep3,
} from "../types";

/**
 * Validates registration step 1 form data
 */
export function validateRegistrationStep1(
  formData: RegistrationStep1
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.firstName.trim()) {
    errors.firstName = "First name is required";
  }

  if (!formData.lastName.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!formData.password) {
    errors.password = "Password is required";
  } else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
}

/**
 * Validates registration step 2 form data
 */
export function validateRegistrationStep2(
  formData: RegistrationStep2
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required";
  } else if (!isOldEnough(formData.dateOfBirth)) {
    errors.dateOfBirth = `You must be at least ${USER_MINIMUM_AGE} years old`;
  }

  if (!formData.height) {
    errors.height = "Height is required";
  } else if (formData.height < 100 || formData.height > 250) {
    errors.height = "Please enter a valid height (100-250 cm)";
  }

  if (!formData.weight) {
    errors.weight = "Weight is required";
  } else if (formData.weight < 30 || formData.weight > 300) {
    errors.weight = "Please enter a valid weight (30-300 kg)";
  }

  return errors;
}

/**
 * Validates registration step 3 form data
 */
export function validateRegistrationStep3(
  formData: RegistrationStep3
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.activityLevel) {
    errors.activityLevel = "Activity level is required";
  }

  return errors;
}
