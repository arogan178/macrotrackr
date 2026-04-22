import { memo } from "react";

import { useStore } from "@/store/store";

import FloatingNotification from "./FloatingNotification";

/**
 * Global notification manager that renders notifications from the app state
 * This component should be mounted once near the root of your application
 */
function NotificationManager() {
  const { notifications, hideNotification } = useStore();

  if (notifications.length === 0) {
    return;
  }

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-50 -translate-x-1/2"
      style={{
        top: "var(--floating-notification-top, 80px)",
      }}
    >
      <div className="flex w-screen max-w-md flex-col gap-3 px-4">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto"
            style={{
              zIndex: 9999 - index,
              // Add slight stagger to entrance animations
              animationDelay: `${index * 50}ms`,
            }}
          >
            <FloatingNotification
              message={notification.message}
              type={notification.type}
              duration={notification.duration}
              autoClose={notification.autoClose}
              onClose={() => hideNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Use memo to prevent unnecessary re-renders when other parts of the app state change
export default memo(NotificationManager);
