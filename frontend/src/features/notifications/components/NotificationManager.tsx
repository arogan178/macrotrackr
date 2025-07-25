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
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex flex-col gap-3 w-screen max-w-md px-4">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto"
            style={{ 
              zIndex: 9999 - index,
              // Add slight stagger to entrance animations
              animationDelay: `${index * 50}ms`
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
