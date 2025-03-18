import { useState, useCallback } from 'react';
import FloatingNotification, { FloatingNotificationProps } from './FloatingNotification';

interface Notification extends FloatingNotificationProps {
  id: string;
}

function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Add a new notification
  const showNotification = useCallback((props: Omit<FloatingNotificationProps, 'onClose'>) => {
    const id = Date.now().toString();
    
    setNotifications(current => [
      ...current,
      {
        ...props,
        id,
        onClose: () => removeNotification(id)
      }
    ]);
    
    return id;
  }, []);

  // Remove a notification by id
  const removeNotification = useCallback((id: string) => {
    setNotifications(current => 
      current.filter(notification => notification.id !== id)
    );
  }, []);

  return (
    <>
      {/* Stack notifications with appropriate spacing */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
        {notifications.map((notification, index) => (
          <div 
            key={notification.id} 
            className="mt-6 pointer-events-auto"
            style={{ zIndex: 9999 - index }} // Higher notifications have higher z-index
          >
            <FloatingNotification {...notification} />
          </div>
        ))}
      </div>
    </>
  );
}

// Create a singleton for global access
let notificationManager: {
  show: (props: Omit<FloatingNotificationProps, 'onClose'>) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
} | null = null;

// Export the component for direct usage
export default NotificationManager;

// Export a hook for accessing the notification functions
export function useNotifications() {
  // This would normally use context in a real app
  // For simplicity in this example, we're creating a mock implementation
  if (!notificationManager) {
    notificationManager = {
      show: (props) => {
        console.log('Notification:', props);
        return Date.now().toString(); 
      },
      success: (message, duration = 5000) => notificationManager!.show({ 
        message, type: 'success', duration 
      }),
      error: (message, duration = 5000) => notificationManager!.show({ 
        message, type: 'error', duration 
      }),
      warning: (message, duration = 5000) => notificationManager!.show({ 
        message, type: 'warning', duration 
      }),
      info: (message, duration = 5000) => notificationManager!.show({ 
        message, type: 'info', duration 
      })
    };
  }
  
  return notificationManager;
}
