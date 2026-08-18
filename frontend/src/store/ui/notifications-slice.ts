import { StateCreator } from "zustand";

import {
  DEFAULT_NOTIFICATION_AUTO_CLOSE,
  DEFAULT_NOTIFICATION_DURATION,
  DEFAULT_NOTIFICATION_TYPE,
  MAX_NOTIFICATIONS,
} from "@/components/notifications/NotificationConstants";
import type { NotificationType } from "@/components/notifications/NotificationTypes";

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
  autoClose: boolean;
  createdAt: number;
}

export interface NotificationSlice {
  notifications: Notification[];
  showNotification: (
    message: string,
    type?: NotificationType,
    options?: {
      duration?: number;
      autoClose?: boolean;
    },
  ) => string;
  hideNotification: (id: string) => void;
}

const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const lastNotificationMap = new Map<string, number>();
const NOTIFICATION_DEDUPE_TIMEOUT = 5000;

export const createNotificationSlice: StateCreator<NotificationSlice> = (
  set,
  get,
) => ({
  notifications: [],

  showNotification: (
    message: string,
    type = DEFAULT_NOTIFICATION_TYPE,
    options: {
      duration?: number;
      autoClose?: boolean;
    } = {},
  ) => {
    const {
      duration = DEFAULT_NOTIFICATION_DURATION,
      autoClose = DEFAULT_NOTIFICATION_AUTO_CLOSE,
    } = options;

    const dedupeKey = `${message}:${type}`;
    const lastShownTime = lastNotificationMap.get(dedupeKey) ?? 0;
    const now = Date.now();

    if (now - lastShownTime < NOTIFICATION_DEDUPE_TIMEOUT) {
      const existing = get().notifications.find(
        (n) => n.message === message && n.type === type,
      );

      return existing?.id ?? `ignored_${now}`;
    }

    lastNotificationMap.set(dedupeKey, now);

    const id = `notif_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const notification: Notification = {
      id,
      message,
      type: type as NotificationType,
      duration,
      autoClose,
      createdAt: now,
    };

    if (autoClose && duration > 0) {
      const timeoutId = setTimeout(() => {
        get().hideNotification(id);
      }, duration);
      activeTimeouts.set(id, timeoutId);
    }

    set((state) => {
      const updated = [...state.notifications, notification];
      if (updated.length > MAX_NOTIFICATIONS) {
        return { notifications: updated.slice(-MAX_NOTIFICATIONS) };
      }

      return { notifications: updated };
    });

    return id;
  },

  hideNotification: (id: string) => {
    const timeoutId = activeTimeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      activeTimeouts.delete(id);
    }

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
});
