import React from 'react';
import { colorPalette } from '../theme';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

interface ErrorStateProps {
  message: string;
  retry?: () => void;
  fullScreen?: boolean;
}

/**
 * Loading component with accessibility features
 */
export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm': return 24;
      case 'md': return 40;
      case 'lg': return 64;
      default: return 40;
    }
  };

  const spinnerSize = getSpinnerSize();

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-opacity-90'
    : 'flex flex-col items-center justify-center p-6';

  return (
    <div
      className={containerClasses}
      style={{ backgroundColor: fullScreen ? colorPalette.richBlack : 'transparent' }}
      role="status"
      aria-live="polite"
    >
      <div className="relative" style={{ width: spinnerSize, height: spinnerSize }}>
        <svg
          className="animate-spin"
          width={spinnerSize}
          height={spinnerSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={colorPalette.darkGrey}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M12 2C6.47715 2 2 6.47715 2 12"
            stroke={colorPalette.subtleOrange}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {message && (
        <p
          className="mt-4 text-center"
          style={{ color: colorPalette.offWhite }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

/**
 * Error state component with accessibility features
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  retry,
  fullScreen = false,
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-opacity-90'
    : 'flex flex-col items-center justify-center p-6';

  return (
    <div
      className={containerClasses}
      style={{ backgroundColor: fullScreen ? colorPalette.richBlack : 'transparent' }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center max-w-md text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: colorPalette.mutedRed }}
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
        
        <h2
          className="mt-4 text-xl font-semibold"
          style={{ color: colorPalette.offWhite }}
        >
          Something went wrong
        </h2>
        
        <p
          className="mt-2"
          style={{ color: colorPalette.lightGrey }}
        >
          {message}
        </p>
        
        {retry && (
          <button
            className="mt-6 px-4 py-2 rounded-md transition-colors duration-200"
            style={{
              backgroundColor: colorPalette.darkGrey,
              color: colorPalette.offWhite,
              border: `1px solid ${colorPalette.subtleOrange}`,
            }}
            onClick={retry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Empty state component for when there's no data to display
 */
export const EmptyState: React.FC<{
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ message, icon, action }) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      style={{ color: colorPalette.lightGrey }}
    >
      {icon || (
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: colorPalette.lightGrey }}
        >
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      
      <p className="mt-4">{message}</p>
      
      {action && (
        <button
          className="mt-4 px-4 py-2 rounded-md transition-colors duration-200"
          style={{
            backgroundColor: colorPalette.darkGrey,
            color: colorPalette.offWhite,
          }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default { Loading, ErrorState, EmptyState };
