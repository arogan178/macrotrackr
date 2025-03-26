import { memo } from "react";
import FloatingNotification from "@/components/FloatingNotification";
import { useStore } from "@/store/store";
/**
 * Global notification manager that renders notifications from the app state
 * This component should be mounted once near the root of your application
 */
function NotificationManager() {
  const { notifications, hideNotification } = useStore();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="mt-6 pointer-events-auto"
          style={{ zIndex: 9999 - index }} // Higher notifications have higher z-index
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
  );
}

// Use memo to prevent unnecessary re-renders when other parts of the app state change
export default memo(NotificationManager);
