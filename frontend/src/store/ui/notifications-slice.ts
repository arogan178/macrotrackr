import { StateCreator } from "zustand";

import {
  DEFAULT_NOTIFICATION_AUTO_CLOSE,
  DEFAULT_NOTIFICATION_DURATION,
  DEFAULT_NOTIFICATION_TYPE,
  MAX_NOTIFICATIONS,
} from "@/components/notifications/Constants";
import type { NotificationType } from "@/components/notifications/Types";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
  autoClose: boolean;
  createdAt: number;
  context?: string; // Optional context identifier for grouping notifications
}

export interface NotificationSlice {
  // Notification state
  notifications: Notification[];
  activeTimeouts: Record<string, number>;
  lastNotificationMap: Record<string, number>; // Track recent notifications by message
  notificationContexts: Record<string, string>; // Track active notification contexts

  // Notification actions
  showNotification: (
    message: string,
    type?: NotificationType,
    options?: {
      duration?: number;
      autoClose?: boolean;
      context?: string; // Optional context for grouping related notifications
    },
  ) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  clearNotificationsByContext: (context: string) => void;
}

// Notification dedupe timeout (in ms)
const NOTIFICATION_DEDUPE_TIMEOUT = 5000;

export const createNotificationSlice: StateCreator<NotificationSlice> = (
  set,
  get,
) => ({
  // Initial state
  notifications: [],
  activeTimeouts: {},
  lastNotificationMap: {},
  notificationContexts: {},

  // Actions
  showNotification: (
    message: string,
    type = DEFAULT_NOTIFICATION_TYPE,
    options: {
      duration?: number;
      autoClose?: boolean;
      context?: string;
    } = {},
  ) => {
    const {
      duration = DEFAULT_NOTIFICATION_DURATION,
      autoClose = DEFAULT_NOTIFICATION_AUTO_CLOSE,
      context,
    } = options;

    // If a context is provided, check if we already have an active notification with this context
    if (context) {
      const existingContextId = get().notificationContexts[context];
      if (existingContextId) {
        // Find the notification with this ID
        const existingNotification = get().notifications.find(
          (n) => n.id === existingContextId,
        );

        // If the existing notification is still active and has the same message and type,
        // just return its ID instead of creating a new notification
        if (
          existingNotification?.message === message &&
          existingNotification.type === type
        ) {
          return existingContextId;
        }

        // If the context exists but with a different message or type,
        // hide the old notification before showing the new one
        get().hideNotification(existingContextId);
      }
    }

    // Check if we've shown this same notification recently to avoid duplicates
    const notificationKey = `${message}:${type}`;
    const lastShownTime = get().lastNotificationMap[notificationKey] || 0;
    const now = Date.now();

    // If the same notification was shown recently, don't show it again
    if (now - lastShownTime < NOTIFICATION_DEDUPE_TIMEOUT) {
      // Return existing notification ID if available, or generate a dummy one
      const existingNotification = get().notifications.find(
        (n) => n.message === message && n.type === type,
      );
      return existingNotification?.id || `ignored_${now}`;
    }

    // Generate a unique ID with timestamp and random component
    const timestamp = Date.now();
    const id = `notif_${timestamp}_${Math.random().toString(36).slice(2, 9)}`;

    const notification: Notification = {
      id,
      message,
      type: type as NotificationType,
      duration, // Use the provided duration or default
      autoClose, // Use the provided autoClose or default
      createdAt: timestamp,
      context, // Store the context if provided
    };

    set((state: NotificationSlice) => {
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
        globalThis.clearTimeout(state.activeTimeouts[id]);
      }

      // Set a new timeout if autoClose is true
      const activeTimeouts = { ...state.activeTimeouts };
      if (autoClose && duration > 0) {
        const timeoutId = globalThis.setTimeout(() => {
          get().hideNotification(id);
        }, duration);

        // Store timeout ID for cleanup
        activeTimeouts[id] = timeoutId as unknown as number;
      }

      // Update the lastNotificationMap to track this message
      const lastNotificationMap = {
        ...state.lastNotificationMap,
        [notificationKey]: timestamp,
      };

      // Update the context map if a context was provided
      const notificationContexts = { ...state.notificationContexts };
      if (context) {
        notificationContexts[context] = id;
      }

      return {
        notifications: updatedNotifications,
        activeTimeouts,
        lastNotificationMap,
        notificationContexts,
      };
    });

    return id;
  },

  hideNotification: (id: string) => {
    set((state: NotificationSlice) => {
      // Clear the timeout to prevent memory leaks
      if (state.activeTimeouts[id]) {
        globalThis.clearTimeout(state.activeTimeouts[id]);
      }

      // Find notification to check if it has a context
      const notification = state.notifications.find((n) => n.id === id);

      // Create new objects to ensure proper state updates
      const activeTimeouts = { ...state.activeTimeouts };
      delete activeTimeouts[id];

      // Also remove from context map if it was associated with a context
      const notificationContexts = { ...state.notificationContexts };
      if (
        notification?.context && // Only remove if the current ID for this context matches this notification
        notificationContexts[notification.context] === id
      ) {
        delete notificationContexts[notification.context];
      }

      return {
        notifications: state.notifications.filter(
          (n: Notification) => n.id !== id,
        ),
        activeTimeouts,
        // Keep lastNotificationMap unchanged
        lastNotificationMap: state.lastNotificationMap,
        notificationContexts,
      };
    });
  },

  clearNotificationsByContext: (context: string) => {
    set((state: NotificationSlice) => {
      const notificationId = state.notificationContexts[context];
      if (notificationId) {
        // Clear the timeout for this notification
        if (state.activeTimeouts[notificationId]) {
          globalThis.clearTimeout(state.activeTimeouts[notificationId]);
        }

        // Create new objects for state updates
        const activeTimeouts = { ...state.activeTimeouts };
        delete activeTimeouts[notificationId];

        const notificationContexts = { ...state.notificationContexts };
        delete notificationContexts[context];

        return {
          notifications: state.notifications.filter(
            (n) => n.id !== notificationId,
          ),
          activeTimeouts,
          lastNotificationMap: state.lastNotificationMap,
          notificationContexts,
        };
      }
      return state;
    });
  },

  clearAllNotifications: () => {
    set((state: NotificationSlice) => {
      // Clear all active timeouts to prevent memory leaks
      for (const timeoutId of Object.values(state.activeTimeouts)) {
        globalThis.clearTimeout(timeoutId as number);
      }

      return {
        notifications: [],
        activeTimeouts: {},
        // Keep lastNotificationMap to continue deduping
        lastNotificationMap: state.lastNotificationMap,
        notificationContexts: {},
      };
    });
  },
});
