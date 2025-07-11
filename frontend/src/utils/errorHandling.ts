/**
 * Extracts a human-readable error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error !== undefined &&
    error !== null &&
    "message" in error
  ) {
    // Use Record<string, unknown> for safer typing
    return String((error as Record<string, unknown>).message);
  }
  return "An unknown error occurred";
}

/**
 * Sets a notification message with automatic timeout
 */
export interface NotificationState {
  notification?: string;
}

export type NotificationSetter = (
  value: NotificationState | ((state: NotificationState) => NotificationState),
) => void;

export function setNotificationWithTimeout(
  set: NotificationSetter,
  message: string,
  duration = 3000,
): void {
  // Set notification message
  set({ notification: message });

  // Clear after duration
  setTimeout(() => {
    set((state: NotificationState) => {
      // Only clear if it's the same message (prevent clearing newer notifications)
      if (state.notification === message) {
        return { notification: undefined };
      }
      return state;
    });
  }, duration);
}
