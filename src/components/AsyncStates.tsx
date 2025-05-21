import React from 'react';

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
}: any) => {
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
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-opacity-90 bg-primary'
    : 'flex flex-col items-center justify-center p-lg';

  return (
    <div
      className={containerClasses}
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
            stroke="var(--clr-ui-element)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M12 2C6.47715 2 2 6.47715 2 12"
            stroke="var(--clr-accent)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {message && (
        <p className="mt-md text-center text-primary">
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
}: any) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-opacity-90 bg-primary'
    : 'flex flex-col items-center justify-center p-lg';

  return (
    <div
      className={containerClasses}
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
          className="text-warning"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
        
        <h2 className="mt-md text-xl font-semibold text-primary">
          Something went wrong
        </h2>
        
        <p className="mt-sm text-secondary">
          {message}
        </p>
        
        {retry && (
          <button
            className="btn btn-secondary mt-lg"
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
}> = ({ message, icon, action }: any) => {
  return (
    <div className="flex flex-col items-center justify-center p-xl text-center text-secondary">
      {icon || (
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-secondary"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      
      <p className="mt-md">{message}</p>
      
      {action && (
        <button
          className="btn btn-secondary mt-md"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default { Loading, ErrorState, EmptyState };
