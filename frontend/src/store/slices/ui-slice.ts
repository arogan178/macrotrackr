import { StateCreator } from "zustand";
import {
  DEFAULT_NOTIFICATION_DURATION,
  DEFAULT_NOTIFICATION_AUTO_CLOSE,
  DEFAULT_NOTIFICATION_TYPE,
  MAX_NOTIFICATIONS,
} from "../../utils/constants";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
  autoClose: boolean;
  createdAt: number;
}

export interface UISlice {
  // Notification state
  notifications: Notification[];
  activeTimeouts: Record<string, number>;

  // Notification actions
  showNotification: (
    message: string,
    type?: NotificationType,
    options?: {
      duration?: number;
      autoClose?: boolean;
    }
  ) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const createUISlice: StateCreator<UISlice & any> = (set, get) => ({
  // Initial state
  notifications: [],
  activeTimeouts: {},

  // Actions
  showNotification: (
    message,
    type = DEFAULT_NOTIFICATION_TYPE,
    options = {}
  ) => {
    const {
      duration = DEFAULT_NOTIFICATION_DURATION,
      autoClose = DEFAULT_NOTIFICATION_AUTO_CLOSE,
    } = options;

    // Generate a unique ID with timestamp and random component
    const timestamp = Date.now();
    const id = `notif_${timestamp}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const notification: Notification = {
      id,
      message,
      type: type as NotificationType,
      duration, // Use the provided duration or default
      autoClose, // Use the provided autoClose or default
      createdAt: timestamp,
    };

    set((state) => {
      // Create a new array with the new notification
      let updatedNotifications = [...state.notifications, notification];

      // If we have too many notifications, remove the oldest ones
      if (updatedNotifications.length > MAX_NOTIFICATIONS) {
        updatedNotifications = updatedNotifications
          .sort((a, b) => a.createdAt - b.createdAt) // Sort by creation time
          .slice(-MAX_NOTIFICATIONS); // Keep only the most recent ones
      }

      // Clear any existing timeout for this ID (shouldn't exist, but just in case)
      if (state.activeTimeouts[id]) {
        window.clearTimeout(state.activeTimeouts[id]);
      }

      // Set a new timeout if autoClose is true
      const activeTimeouts = { ...state.activeTimeouts };
      if (autoClose && duration > 0) {
        const timeoutId = window.setTimeout(() => {
          get().hideNotification(id);
        }, duration);

        // Store timeout ID for cleanup
        activeTimeouts[id] = timeoutId;
      }

      return {
        notifications: updatedNotifications,
        activeTimeouts,
      };
    });

    return id;
  },

  hideNotification: (id) => {
    set((state) => {
      // Clear the timeout to prevent memory leaks
      if (state.activeTimeouts[id]) {
        window.clearTimeout(state.activeTimeouts[id]);
      }

      // Create new objects to ensure proper state updates
      const activeTimeouts = { ...state.activeTimeouts };
      delete activeTimeouts[id];

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        activeTimeouts,
      };
    });
  },

  clearAllNotifications: () => {
    set((state) => {
      // Clear all active timeouts to prevent memory leaks
      Object.values(state.activeTimeouts).forEach((timeoutId) => {
        window.clearTimeout(timeoutId as number);
      });

      return {
        notifications: [],
        activeTimeouts: {},
      };
    });
  },
});
