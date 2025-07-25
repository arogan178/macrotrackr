import { useStore } from "@/store/store";

/**
 * Extracts a user-friendly error message from an unknown error type.
 * @param error The error object.
 * @returns A string representing the error message.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred.";
}

/**
 * Handles API errors by logging them and displaying a toast notification.
 * @param error The error object.
 * @param context A string providing context for the error.
 */
export function handleApiError(error: unknown, context?: string) {
  const errorMessage = getErrorMessage(error);
  const contextMessage = context ? `(${context})` : "";

  console.error(`API Error${contextMessage}:`, error);
  useStore.getState().showNotification(errorMessage, "error");
}