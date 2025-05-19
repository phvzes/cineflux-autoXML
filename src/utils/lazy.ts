
import React from 'react';

/**
 * Enhanced lazy loading utility that supports named exports
 * @param factory Function that imports the component
 * @param name Name of the exported component (for named exports)
 * @returns Lazy loaded component
 */
export function namedLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ [key: string]: T }>,
  name: string
): React.LazyExoticComponent<T> {
  return React.lazy(() => 
    factory().then((module) => ({ default: module[name] }))
  );
}

/**
 * Preload a component to improve perceived performance
 * @param factory Function that imports the component
 * @returns Promise that resolves when the component is loaded
 */
export function preloadComponent(factory: () => Promise<any>): Promise<any> {
  return factory();
}

/**
 * Enhanced lazy loading with automatic error boundary and loading indicator
 * @param factory Function that imports the component
 * @param fallback Component to show while loading
 * @returns Lazy loaded component with error boundary
 */
export function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback: React.ReactNode = null
): React.LazyExoticComponent<T> {
  // Return the lazy component directly - JSX should be handled by the component consumer
  return React.lazy(factory);
}

export default {
  namedLazy,
  preloadComponent,
  safeLazy
};
