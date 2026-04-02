// Error messages for authentication
export const AUTH_ERROR_MESSAGES = {
  // Field-specific errors
  dateOfBirthRequired: "Date of birth is required",
  heightRequired: "Height is required",
  heightInvalid: "Please enter a valid height (100-250 cm)",
  weightRequired: "Weight is required",
  weightInvalid: "Please enter a valid weight (30-300 kg)",
  activityLevelRequired: "Activity level is required",
} as const;

export const AUTH_NOT_READY_MESSAGE =
  "Authentication not ready. Please try again.";
