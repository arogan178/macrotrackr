import { USER_MINIMUM_AGE } from "./constants";

/**
 * Validates if a user is old enough based on their date of birth
 */
export function isOldEnough(dateOfBirth: string): boolean {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= USER_MINIMUM_AGE;
}
