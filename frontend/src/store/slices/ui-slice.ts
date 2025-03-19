import { StateCreator } from 'zustand';
import { generateUniqueId } from '../../utils/id-generator';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

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
  showNotification: (message: string, type: NotificationType, options?: {
    duration?: number;
    autoClose?: boolean;
  }) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const createUISlice: StateCreator<UISlice & any> = (set, get) => ({
  // Initial state
  notifications: [],
  
  // Actions
  showNotification: (message, type = 'info', options = {}) => {
    const { duration = 5000, autoClose = true } = options;
    const id = generateUniqueId('notif');
    
    const notification: Notification = {
      id,
      message,
      type,
      duration,
      autoClose
    };
    
    set(state => ({
      notifications: [...state.notifications, notification]
    }));
    
    // Auto-dismiss notification after duration if autoClose is true
    if (autoClose && duration > 0) {
      setTimeout(() => {
        get().hideNotification(id);
      }, duration);
    }
    
    return id;
  },
  
  hideNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  
  clearAllNotifications: () => {
    set({ notifications: [] });
  }
});
