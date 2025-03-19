import { StateCreator } from "zustand";
import { generateUniqueId } from "../../utils/id-generator";
import {
  DEFAULT_NOTIFICATION_DURATION,
  DEFAULT_NOTIFICATION_AUTO_CLOSE,
  DEFAULT_NOTIFICATION_TYPE,
} from "../../utils/constants";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
  autoClose: boolean;
}

export interface UISlice {
  // Notification state
  notifications: Notification[];

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
    const id = generateUniqueId("notif");

    const notification: Notification = {
      id,
      message,
      type,
      duration: DEFAULT_NOTIFICATION_DURATION,
      autoClose: DEFAULT_NOTIFICATION_AUTO_CLOSE,
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-dismiss notification after duration if autoClose is true
    if (autoClose && duration > 0) {
      setTimeout(() => {
        // Use the getter to ensure we're accessing the latest state
        get().hideNotification(id);
      }, duration);
    }

    return id;
  },

  hideNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },
});
