
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number; // Duration in milliseconds
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
  actionLabel,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-[#48BB78]" size={20} />;
      case 'error':
        return <AlertCircle className="text-[#F56565]" size={20} />;
      case 'info':
        return <Info className="text-[#4299E1]" size={20} />;
    }
  };
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-[#1C4532]';
      case 'error':
        return 'bg-[#4A2525]';
      case 'info':
        return 'bg-[#2A4365]';
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full ${getBackgroundColor()} rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out`}>
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-[#F5F5F7] text-sm">{message}</p>
          {actionLabel && onAction && (
            <button 
              onClick={onAction}
              className="mt-2 text-xs font-medium text-white hover:underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
        <button 
          onClick={handleClose}
          className="flex-shrink-0 ml-2 text-[#A0A0A7] hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
