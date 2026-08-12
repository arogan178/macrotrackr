import { AUTH_ERROR_MESSAGES } from "@/features/auth/constants";
import {
  USER_MAXIMUM_HEIGHT,
  USER_MAXIMUM_WEIGHT,
  USER_MINIMUM_AGE,
  USER_MINIMUM_HEIGHT,
  USER_MINIMUM_WEIGHT,
} from "@/utils/constants";
import { isOldEnough } from "@/utils/validation";

export interface ProfileFormData {
  dateOfBirth: string;
  gender: string;
  height: number | null;
  weight: number | null;
  activityLevel: number | null;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateStep1(
  dateOfBirth: string,
  gender: string,
  height: number | null,
  weight: number | null,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!dateOfBirth) {
    errors.dateOfBirth = AUTH_ERROR_MESSAGES.dateOfBirthRequired;
  } else if (!isOldEnough(dateOfBirth)) {
    errors.dateOfBirth = `You must be at least ${USER_MINIMUM_AGE} years old`;
  }

  if (!gender) {
    errors.gender = "Gender is required";
  }

  if (!height) {
    errors.height = AUTH_ERROR_MESSAGES.heightRequired;
  } else if (height < USER_MINIMUM_HEIGHT || height > USER_MAXIMUM_HEIGHT) {
    errors.height = `Please enter a valid height (${USER_MINIMUM_HEIGHT}-${USER_MAXIMUM_HEIGHT} cm)`;
  }

  if (!weight) {
    errors.weight = AUTH_ERROR_MESSAGES.weightRequired;
  } else if (weight < USER_MINIMUM_WEIGHT || weight > USER_MAXIMUM_WEIGHT) {
    errors.weight = `Please enter a valid weight (${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`;
  }

  return errors;
}

export function validateStep2(activityLevel: number | null): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!activityLevel) {
    errors.activityLevel = AUTH_ERROR_MESSAGES.activityLevelRequired;
  }

  return errors;
}

export function validateGoalStep(
  weightGoal: "lose" | "maintain" | "gain" | "",
  targetWeight: number | null,
  currentWeight: number | null,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!weightGoal) {
    errors.weightGoal = "Pick a goal to continue";

    return errors;
  }

  if (weightGoal === "maintain") {
    return errors;
  }

  if (!targetWeight) {
    errors.targetWeight = "Target weight is required";
  } else if (
    targetWeight < USER_MINIMUM_WEIGHT ||
    targetWeight > USER_MAXIMUM_WEIGHT
  ) {
    errors.targetWeight = `Please enter a valid weight (${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`;
  } else if (currentWeight) {
    if (weightGoal === "lose" && targetWeight >= currentWeight) {
      errors.targetWeight = `To lose weight, your target must be under ${currentWeight} kg`;
    }
    if (weightGoal === "gain" && targetWeight <= currentWeight) {
      errors.targetWeight = `To gain weight, your target must be over ${currentWeight} kg`;
    }
  }

  return errors;
}

export function getFirstErrorMessage(errors: ValidationErrors): string | undefined {
  return Object.values(errors)[0];
}
