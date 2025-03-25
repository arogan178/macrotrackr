import { useEffect, useState } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationContent {
  message: string;
  type: NotificationType;
}

interface FloatingNotificationProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  notifications?: NotificationContent[];
  onClear?: () => void;
  position?: 'top' | 'bottom';
  duration?: number;
  hideAutomatically?: boolean;
}

export default function FloatingNotification({ 
  error, 
  success,
  warning,
  info,
  notifications,
  onClear,
  position = 'top',
  duration = 3000,
  hideAutomatically = true
}: FloatingNotificationProps) {
  const [internalNotifications, setInternalNotifications] = useState<NotificationContent[]>([]);
  const [isLeaving, setIsLeaving] = useState(false);

  // Process incoming props into unified notifications array
  useEffect(() => {
    const newNotifications: NotificationContent[] = [];
    
    if (success) newNotifications.push({ message: success, type: 'success' });
    if (error) newNotifications.push({ message: error, type: 'error' });
    if (warning) newNotifications.push({ message: warning, type: 'warning' });
    if (info) newNotifications.push({ message: info, type: 'info' });
    
    // Add explicitly provided notifications array if available
    if (notifications && notifications.length > 0) {
      newNotifications.push(...notifications);
    }
    
    if (newNotifications.length > 0) {
      setIsLeaving(false);
      setInternalNotifications(newNotifications);
    }
  }, [success, error, warning, info, notifications]);

  // Handle auto-clear with animations
  useEffect(() => {
    if (internalNotifications.length > 0 && hideAutomatically) {
      // Start fade out animation before clearing
      const fadeOutTimer = setTimeout(() => {
        setIsLeaving(true);
      }, duration - 300); // Start fade out 300ms before removal

      const clearTimer = setTimeout(() => {
        if (onClear) {
          onClear();
        }
        setInternalNotifications([]);
        setIsLeaving(false);
      }, duration);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [internalNotifications, onClear, duration, hideAutomatically]);

  const clearNotifications = () => {
    setIsLeaving(true);
    // Wait for fade out animation before clearing
    setTimeout(() => {
      if (onClear) {
        onClear();
      }
      setInternalNotifications([]);
      setIsLeaving(false);
    }, 300);
  };

  if (internalNotifications.length === 0) return null;

  const positionClass = position === 'top' ? 'top-24' : 'bottom-8';

  return (
    <div className={`fixed ${positionClass} left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4 space-y-2 pointer-events-auto`}>
      {internalNotifications.map((notification, index) => (
        <NotificationItem 
          key={`${notification.type}-${index}`} 
          notification={notification} 
          onClose={clearNotifications}
          isLeaving={isLeaving}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: NotificationContent;
  onClose: () => void;
  isLeaving: boolean;
}

function NotificationItem({ notification, onClose, isLeaving }: NotificationItemProps) {
  const { type, message } = notification;

  const notificationStyles = {
    success: {
      bg: "bg-green-900/90",
      border: "border-green-800",
      text: "text-green-400",
      icon: (
        <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: "bg-red-900/90",
      border: "border-red-800",
      text: "text-red-400",
      icon: (
        <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: "bg-amber-900/90",
      border: "border-amber-800",
      text: "text-amber-400",
      icon: (
        <svg className="h-5 w-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      bg: "bg-blue-900/90",
      border: "border-blue-800",
      text: "text-blue-400",
      icon: (
        <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const style = notificationStyles[type];

  return (
    <div 
      className={`${style.text} ${style.bg} p-4 rounded-lg border ${style.border} shadow-xl
                  transition-all duration-300 ease-in-out transform
                  ${isLeaving 
                    ? 'opacity-0 translate-y-2 scale-95' 
                    : 'opacity-100 translate-y-0 scale-100'
                  }
                  flex justify-between items-center`}
    >
      <div className="flex items-center">
        {style.icon}
        {message}
      </div>
      <button 
        onClick={onClose}
        className="ml-3 text-gray-400 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}