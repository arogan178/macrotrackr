import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useStore } from "@/store/store";

/**
 * A hook that manages notifications across route changes
 * to prevent duplicate notifications when navigating between pages
 */
export function useNotificationManager() {
  const location = useLocation();
  const {
    clearSettingsMessages,
    notifications,
    hideNotification,
    settingsSuccess,
  } = useStore();

  // Clear settings-related notifications when navigating away from settings page
  useEffect(() => {
    // Check if we've navigated away from the settings page
    if (!location.pathname.includes("/settings")) {
      // If we have a settings success message, clear it
      if (settingsSuccess) {
        clearSettingsMessages();
      }

      // Also clear any success notifications related to settings
      if (notifications.length > 0) {
        for (const notification of notifications) {
          if (
            notification.type === "success" &&
            notification.message.toLowerCase().includes("settings")
          ) {
            hideNotification(notification.id);
          }
        }
      }
    }
  }, [
    location.pathname,
    settingsSuccess,
    clearSettingsMessages,
    notifications,
    hideNotification,
  ]);

  return;
}
