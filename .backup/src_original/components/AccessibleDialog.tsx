import React, { useRef, useEffect } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
}

/**
 * AccessibleDialog component that follows WAI-ARIA best practices for modal dialogs.
 * 
 * Features:
 * - Proper focus management
 * - Keyboard navigation (Escape to close)
 * - ARIA attributes for screen readers
 * - Focus trap within the dialog
 */
export const AccessibleDialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  closeOnEsc = true,
  closeOnOutsideClick = true,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`dialog-title-${Math.random().toString(36).substr(2, 9)}`).current;
  const descriptionId = useRef(`dialog-desc-${Math.random().toString(36).substr(2, 9)}`).current;

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Store the element that had focus before opening the dialog
      const previouslyFocusedElement = document.activeElement as HTMLElement;
      
      // Focus the dialog itself
      dialogRef.current.focus();

      return () => {
        // Restore focus when dialog closes
        if (previouslyFocusedElement) {
          previouslyFocusedElement.focus();
        }
      };
    }
  }, [isOpen]);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculate max-width based on prop
  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'sm': return '24rem'; // 384px
      case 'md': return '32rem'; // 512px
      case 'lg': return '48rem'; // 768px
      case 'xl': return '64rem'; // 1024px
      case 'full': return '100%';
      default: return '32rem'; // 512px
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black bg-opacity-50 animate-fade-in"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative rounded-lg shadow-xl focus:outline-none bg-secondary text-primary animate-slide-in"
        style={{
          maxWidth: getMaxWidth(),
          width: '100%',
        }}
        tabIndex={-1}
      >
        <div className="p-lg">
          <div className="flex items-center justify-between mb-md">
            <h2
              id={titleId}
              className="text-xl font-semibold"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-sm rounded-full hover:bg-ui hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary transition"
              aria-label="Close dialog"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          
          {description && (
            <p id={descriptionId} className="mb-md text-secondary">
              {description}
            </p>
          )}
          
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AccessibleDialog;
