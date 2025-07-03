import { USER_MINIMUM_AGE } from "@/utils/constants";
import { isOldEnough } from "@/utils/validation";
import {
  RegistrationStep1,
  RegistrationStep2,
  RegistrationStep3,
} from "../types";
import { AUTH_ERROR_MESSAGES } from "../constants";
import {
  validateEmailFormat,
  validatePasswordStrength,
  validateHeightRange,
  validateWeightRange,
} from "./auth-utils";

/**
 * Validates registration step 1 form data
 */
export function validateRegistrationStep1(
  formData: RegistrationStep1
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.firstName.trim()) {
    errors.firstName = AUTH_ERROR_MESSAGES.firstNameRequired;
  }

  if (!formData.lastName.trim()) {
    errors.lastName = AUTH_ERROR_MESSAGES.lastNameRequired;
  }

  if (!formData.email.trim()) {
    errors.email = AUTH_ERROR_MESSAGES.emailRequired;
  } else if (!validateEmailFormat(formData.email)) {
    errors.email = AUTH_ERROR_MESSAGES.emailInvalid;
  }

  if (!formData.password) {
    errors.password = AUTH_ERROR_MESSAGES.passwordRequired;
  } else if (!validatePasswordStrength(formData.password)) {
    errors.password = AUTH_ERROR_MESSAGES.passwordTooShort;
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
    errors.dateOfBirth = AUTH_ERROR_MESSAGES.dateOfBirthRequired;
  } else if (!isOldEnough(formData.dateOfBirth)) {
    errors.dateOfBirth = `You must be at least ${USER_MINIMUM_AGE} years old`;
  }

  if (!formData.height) {
    errors.height = AUTH_ERROR_MESSAGES.heightRequired;
  } else if (!validateHeightRange(formData.height)) {
    errors.height = AUTH_ERROR_MESSAGES.heightInvalid;
  }

  if (!formData.weight) {
    errors.weight = AUTH_ERROR_MESSAGES.weightRequired;
  } else if (!validateWeightRange(formData.weight)) {
    errors.weight = AUTH_ERROR_MESSAGES.weightInvalid;
  }

  if (!formData.gender || formData.gender === "") {
    errors.gender = "Gender is required";
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
    errors.activityLevel = AUTH_ERROR_MESSAGES.activityLevelRequired;
  }

  return errors;
}
