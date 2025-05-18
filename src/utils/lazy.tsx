
/**
 * lazy.tsx
 * 
 * Utility for optimized lazy loading of components with performance tracking.
 * Provides a wrapper around React.lazy with additional features like:
 * - Performance tracking for component loading
 * - Retry mechanism for failed imports
 * - Preloading capabilities for critical components
 */

import { lazy as reactLazy, ComponentType, LazyExoticComponent } from 'react';
import { perfMonitor } from './perfMonitor';

// Type for the import function used by React.lazy
type ImportFunction<T extends ComponentType<any>> = () => Promise<{ default: T }>;

// Cache for preloaded components
const preloadCache = new Map<string, Promise<any>>();

/**
 * Enhanced lazy loading function with performance tracking
 * 
 * @param importFn - The import function for the component
 * @param options - Configuration options
 * @returns LazyExoticComponent - The lazy-loaded component
 */
export function lazy<T extends ComponentType<any>>(
  importFn: ImportFunction<T>,
  options: {
    componentName?: string;
    retries?: number;
    retryDelay?: number;
  } = {}
): LazyExoticComponent<T> {
  const {
    componentName = 'UnnamedComponent',
    retries = 2,
    retryDelay = 1500,
  } = options;

  // Create a wrapped import function with performance tracking and retry logic
  const enhancedImportFn = async () => {
    const startTime = performance.now();
    perfMonitor.mark(`lazy-load-start-${componentName}`);

    let lastError: Error | null = null;
    
    // Retry logic for component loading
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // If not the first attempt, wait before retrying
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
        // Load the component
        const result = await importFn();
        
        // Track performance
        const loadTime = performance.now() - startTime;
        perfMonitor.mark(`lazy-load-end-${componentName}`);
        perfMonitor.measure(
          `lazy-load-${componentName}`,
          `lazy-load-start-${componentName}`,
          `lazy-load-end-${componentName}`
        );
        
        // Log performance in development
        if (import.meta.env.DEV) {
          console.log(`[Lazy] Loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Log retry attempts in development
        if (import.meta.env.DEV) {
          console.warn(`[Lazy] Failed to load ${componentName}, attempt ${attempt + 1}/${retries + 1}`);
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError;
  };

  // Create the lazy component
  return reactLazy(enhancedImportFn);
}

/**
 * Preload a component without rendering it
 * 
 * @param importFn - The import function for the component
 * @param componentName - Name of the component for tracking
 * @returns Promise that resolves when the component is loaded
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: ImportFunction<T>,
  componentName = 'UnnamedComponent'
): Promise<void> {
  // Create a cache key for this component
  const cacheKey = componentName;
  
  // Return cached preload if available
  if (preloadCache.has(cacheKey)) {
    return preloadCache.get(cacheKey) as Promise<void>;
  }
  
  // Create a preload promise
  const preloadPromise = importFn()
    .then(() => {
      if (import.meta.env.DEV) {
        console.log(`[Lazy] Preloaded ${componentName}`);
      }
    })
    .catch(error => {
      // Remove from cache on error
      preloadCache.delete(cacheKey);
      console.error(`[Lazy] Failed to preload ${componentName}:`, error);
      throw error;
    });
  
  // Store in cache
  preloadCache.set(cacheKey, preloadPromise);
  
  return preloadPromise;
}

/**
 * Create a lazy-loaded component with a specific name
 * 
 * @param importFn - The import function for the component
 * @param componentName - Name of the component for tracking
 * @returns LazyExoticComponent - The lazy-loaded component
 */
export function namedLazy<T extends ComponentType<any>>(
  importFn: ImportFunction<T>,
  componentName: string
): LazyExoticComponent<T> {
  return lazy(importFn, { componentName });
}

export default {
  lazy,
  preloadComponent,
  namedLazy,
};
