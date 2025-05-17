/**
 * Hook for implementing keyboard navigation in the application
 */

import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  handler: KeyHandler;
  description: string;
}

/**
 * Hook to register keyboard shortcuts
 * 
 * @param shortcuts Array of keyboard shortcuts to register
 * @param isEnabled Whether the shortcuts are enabled
 */
export function useKeyboardNavigation(
  shortcuts: KeyboardShortcut[],
  isEnabled: boolean = true
): { shortcuts: { key: string; description: string }[] } {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isEnabled) return;
      
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      
      // Find matching shortcut
      const matchingShortcut = shortcuts.find(
        (shortcut) =>
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.shiftKey === event.shiftKey
      );
      
      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.handler(event);
      }
    },
    [shortcuts, isEnabled]
  );
  
  useEffect(() => {
    if (isEnabled) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isEnabled]);
  
  // Return formatted shortcuts for documentation
  const formattedShortcuts = shortcuts.map((shortcut) => {
    const modifiers = [
      shortcut.ctrlKey && 'Ctrl',
      shortcut.altKey && 'Alt',
      shortcut.shiftKey && 'Shift',
    ]
      .filter(Boolean)
      .join('+');
    
    const key = shortcut.key === ' ' ? 'Space' : shortcut.key;
    const formattedKey = modifiers ? `${modifiers}+${key}` : key;
    
    return {
      key: formattedKey,
      description: shortcut.description,
    };
  });
  
  return { shortcuts: formattedShortcuts };
}

export default useKeyboardNavigation;
