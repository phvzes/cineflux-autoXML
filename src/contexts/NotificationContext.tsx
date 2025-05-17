
import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification, { NotificationType } from '../components/common/Notification';

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, options?: {
    duration?: number;
    actionLabel?: string;
    onAction?: () => void;
  }) => string;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  const showNotification = useCallback((type: NotificationType, message: string, options?: {
    duration?: number;
    actionLabel?: string;
    onAction?: () => void;
  }) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message, ...options }]);
    return id;
  }, []);
  
  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {/* Render all active notifications */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            actionLabel={notification.actionLabel}
            onAction={notification.onAction}
            onClose={() => hideNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
