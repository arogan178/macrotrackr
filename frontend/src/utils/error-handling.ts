/**
 * Extracts a human-readable error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as Record<string, any>).message);
  }
  return "An unknown error occurred";
}

/**
 * Sets a notification message with automatic timeout
 */
export function setNotificationWithTimeout(
  set: Function,
  message: string,
  duration = 3000,
): void {
  // Set notification message
  set({ notification: message });

  // Clear after duration
  setTimeout(() => {
    set((state: any) => {
      // Only clear if it's the same message (prevent clearing newer notifications)
      if (state.notification === message) {
        return { notification: null };
      }
      return state;
    });
  }, duration);
}
