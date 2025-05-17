
import { useRef, useEffect } from 'react';

/**
 * Hook to trap focus within a container element for accessibility
 * 
 * This is useful for modals, dialogs, and other components that need to trap focus
 * to ensure keyboard navigation stays within the component.
 * 
 * @param isActive - Whether the focus trap is active
 * @param onEscape - Optional callback to run when Escape key is pressed
 * @returns A ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean,
  onEscape?: () => void
) {
  const containerRef = useRef<T>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    
    // Find all focusable elements within the container
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus the first element when the trap is activated
    firstElement.focus();
    
    // Handle keydown events
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }
      
      // Handle Tab key to trap focus
      if (event.key === 'Tab') {
        // Shift + Tab
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } 
        // Tab
        else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    // Save the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus when the trap is deactivated
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [isActive, onEscape]);
  
  return containerRef;
}

export default useFocusTrap;
