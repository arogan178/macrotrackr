import { useStore } from "@/store/store";

/**
 * Extracts a human-readable error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error && "message" in (error as any)) {
    return String((error as Record<string, unknown>).message);
  }
  return "An unknown error occurred";
}

/**
 * API error handler that logs and shows a toast/notification (merged from errorUtils.ts)
 */
export function handleApiError(error: unknown, context?: string) {
  const errorMessage = getErrorMessage(error);
  const contextMessage = context ? `(${context})` : "";
  // eslint-disable-next-line no-console
  console.error(`API Error${contextMessage}:`, error);

  // Notify via zustand store if available
  try {
    const state = useStore.getState();
    if (typeof state.showNotification === "function") {
      state.showNotification(errorMessage, "error");
    }
  } catch {
    // Fallback: no store available
  }
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
