
/**
 * prefetch.ts
 * 
 * Utility for prefetching resources to improve application performance.
 * Supports prefetching of various resource types:
 * - JavaScript modules
 * - CSS stylesheets
 * - Images
 * - Fonts
 * - WebAssembly modules
 * 
 * Enhanced with priority-based prefetching and queue management.
 */

import { getWasmModuleUrl } from '../wasmLoader';
import { perfMonitor } from '../perfMonitor';

// Cache to track prefetched resources
const prefetchCache = new Set<string>();

// Priority levels for prefetching
export enum PrefetchPriority {
  CRITICAL = 0,  // Must be loaded immediately
  HIGH = 1,      // Should be loaded soon
  MEDIUM = 2,    // Can be loaded when high priority items are done
  LOW = 3,       // Load only when system is idle
}

// Interface for prefetch queue item
interface PrefetchQueueItem {
  url: string;
  options: PrefetchOptions;
  priority: PrefetchPriority;
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
}

// Interface for prefetch options
interface PrefetchOptions {
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch';
  type?: string;
  importance?: 'high' | 'low' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

// Prefetch queue
const prefetchQueue: PrefetchQueueItem[] = [];

// Flag to track if the queue processor is running
let isProcessingQueue = false;

// Maximum number of concurrent prefetch operations
const MAX_CONCURRENT_PREFETCH = 4;

// Current number of active prefetch operations
let activePrefetchCount = 0;

/**
 * Process the prefetch queue
 */
function processPrefetchQueue(): void {
  // If already processing or queue is empty, return
  if (isProcessingQueue || prefetchQueue.length === 0) {
    return;
  }
  
  // Set processing flag
  isProcessingQueue = true;
  
  // Sort queue by priority
  prefetchQueue.sort((a, b) => a.priority - b.priority);
  
  // Process queue items up to the maximum concurrent limit
  const processNextBatch = () => {
    // If queue is empty, stop processing
    if (prefetchQueue.length === 0) {
      isProcessingQueue = false;
      return;
    }
    
    // Calculate how many more items we can process
    const availableSlots = MAX_CONCURRENT_PREFETCH - activePrefetchCount;
    
    if (availableSlots <= 0) {
      // Wait for active prefetches to complete
      setTimeout(processNextBatch, 100);
      return;
    }
    
    // Process up to availableSlots items
    const itemsToProcess = Math.min(availableSlots, prefetchQueue.length);
    
    for (let i = 0; i < itemsToProcess; i++) {
      const item = prefetchQueue.shift();
      
      if (!item) continue;
      
      activePrefetchCount++;
      
      // Execute the prefetch
      executePrefetch(item.url, item.options)
        .then(() => {
          activePrefetchCount--;
          item.resolve();
          
          // Check if we can process more items
          if (prefetchQueue.length > 0) {
            processNextBatch();
          } else if (activePrefetchCount === 0) {
            isProcessingQueue = false;
          }
        })
        .catch((error) => {
          activePrefetchCount--;
          item.reject(error);
          
          // Check if we can process more items
          if (prefetchQueue.length > 0) {
            processNextBatch();
          } else if (activePrefetchCount === 0) {
            isProcessingQueue = false;
          }
        });
    }
  };
  
  // Start processing
  processNextBatch();
}

/**
 * Execute a prefetch operation
 * 
 * @param url - URL of the resource to prefetch
 * @param options - Prefetch options
 * @returns Promise that resolves when the prefetch is complete
 */
function executePrefetch(
  url: string,
  options: PrefetchOptions = {}
): Promise<void> {
  // Default options
  const {
    as = 'fetch',
    type,
    importance = 'auto',
    crossOrigin,
  } = options;
  
  // Create a cache key for this resource
  const cacheKey = url;
  
  // Skip if already prefetched
  if (prefetchCache.has(cacheKey)) {
    return Promise.resolve();
  }
  
  // Mark as prefetched
  prefetchCache.add(cacheKey);
  
  // Start performance tracking
  perfMonitor.mark(`prefetch-start-${url}`);
  
  return new Promise((resolve, reject) => {
    try {
      // Create link element
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = as;
      
      // Set optional attributes
      if (type) link.type = type;
      if (importance !== 'auto') (link as any).importance = importance;
      if (crossOrigin) link.crossOrigin = crossOrigin;
      
      // Handle load and error events
      link.onload = () => {
        // End performance tracking
        perfMonitor.mark(`prefetch-end-${url}`);
        perfMonitor.measure(
          `prefetch-${url}`,
          `prefetch-start-${url}`,
          `prefetch-end-${url}`
        );
        
        if (import.meta.env.DEV) {
          console.log(`[Prefetch] Successfully prefetched: ${url}`);
        }
        
        resolve();
      };
      
      link.onerror = () => {
        // Remove from cache on error
        prefetchCache.delete(cacheKey);
        
        if (import.meta.env.DEV) {
          console.warn(`[Prefetch] Failed to prefetch: ${url}`);
        }
        
        reject(new Error(`Failed to prefetch: ${url}`));
      };
      
      // Add to document head
      document.head.appendChild(link);
    } catch (error) {
      // Remove from cache on error
      prefetchCache.delete(cacheKey);
      reject(error);
    }
  });
}

/**
 * Add a resource to the prefetch queue
 * 
 * @param url - URL of the resource to prefetch
 * @param options - Prefetch options
 * @param priority - Priority level for prefetching
 * @returns Promise that resolves when the prefetch is complete
 */
function queuePrefetch(
  url: string,
  options: PrefetchOptions = {},
  priority: PrefetchPriority = PrefetchPriority.MEDIUM
): Promise<void> {
  // Create a cache key for this resource
  const cacheKey = url;
  
  // Skip if already prefetched
  if (prefetchCache.has(cacheKey)) {
    return Promise.resolve();
  }
  
  // Create a new promise for this prefetch
  return new Promise<void>((resolve, reject) => {
    // Add to queue
    prefetchQueue.push({
      url,
      options,
      priority,
      resolve,
      reject,
    });
    
    // Start processing the queue if not already processing
    if (!isProcessingQueue) {
      processPrefetchQueue();
    }
  });
}

/**
 * Prefetch a resource using a link element
 * 
 * @param url - URL of the resource to prefetch
 * @param options - Prefetch options
 * @param priority - Priority level for prefetching
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchResource(
  url: string,
  options: PrefetchOptions = {},
  priority: PrefetchPriority = PrefetchPriority.MEDIUM
): Promise<void> {
  return queuePrefetch(url, options, priority);
}

/**
 * Prefetch a JavaScript module
 * 
 * @param url - URL of the JavaScript module to prefetch
 * @param priority - Priority level for prefetching
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchScript(
  url: string,
  priority: PrefetchPriority = PrefetchPriority.HIGH
): Promise<void> {
  return prefetchResource(url, { as: 'script', importance: 'high' }, priority);
}

/**
 * Prefetch a CSS stylesheet
 * 
 * @param url - URL of the CSS stylesheet to prefetch
 * @param priority - Priority level for prefetching
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchStylesheet(
  url: string,
  priority: PrefetchPriority = PrefetchPriority.HIGH
): Promise<void> {
  return prefetchResource(url, { as: 'style' }, priority);
}

/**
 * Prefetch an image
 * 
 * @param url - URL of the image to prefetch
 * @param priority - Priority level for prefetching
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchImage(
  url: string,
  priority: PrefetchPriority = PrefetchPriority.MEDIUM
): Promise<void> {
  return prefetchResource(url, { as: 'image' }, priority);
}

/**
 * Prefetch a font
 * 
 * @param url - URL of the font to prefetch
 * @param fontFormat - Format of the font (e.g., 'woff2', 'woff', 'ttf')
 * @param priority - Priority level for prefetching
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchFont(
  url: string,
  fontFormat: string,
  priority: PrefetchPriority = PrefetchPriority.MEDIUM
): Promise<void> {
  return prefetchResource(
    url,
    { 
      as: 'font', 
      type: `font/${fontFormat}`,
      crossOrigin: 'anonymous'
    },
    priority
  );
}

/**
 * Prefetch a WebAssembly module
 * 
 * @param modulePath - Path to the WebAssembly module
 * @param priority - Priority level for prefetching
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchWasmModule(
  modulePath: string,
  priority: PrefetchPriority = PrefetchPriority.HIGH
): Promise<void> {
  const url = getWasmModuleUrl(modulePath);
  return prefetchResource(
    url,
    { 
      as: 'fetch',
      crossOrigin: 'anonymous',
      importance: 'high'
    },
    priority
  );
}

/**
 * Prefetch critical resources for the application
 * 
 * @param resources - List of resources to prefetch with priorities
 * @returns Promise that resolves when all prefetches are complete
 */
export function prefetchCriticalResources(resources: {
  scripts?: Array<{ url: string; priority?: PrefetchPriority }>;
  stylesheets?: Array<{ url: string; priority?: PrefetchPriority }>;
  images?: Array<{ url: string; priority?: PrefetchPriority }>;
  wasmModules?: Array<{ path: string; priority?: PrefetchPriority }>;
}): Promise<void[]> {
  const promises: Promise<void>[] = [];
  
  // Prefetch scripts
  if (resources.scripts) {
    resources.scripts.forEach(({ url, priority = PrefetchPriority.HIGH }) => {
      promises.push(prefetchScript(url, priority));
    });
  }
  
  // Prefetch stylesheets
  if (resources.stylesheets) {
    resources.stylesheets.forEach(({ url, priority = PrefetchPriority.HIGH }) => {
      promises.push(prefetchStylesheet(url, priority));
    });
  }
  
  // Prefetch images
  if (resources.images) {
    resources.images.forEach(({ url, priority = PrefetchPriority.MEDIUM }) => {
      promises.push(prefetchImage(url, priority));
    });
  }
  
  // Prefetch WebAssembly modules
  if (resources.wasmModules) {
    resources.wasmModules.forEach(({ path, priority = PrefetchPriority.HIGH }) => {
      promises.push(prefetchWasmModule(path, priority));
    });
  }
  
  return Promise.all(promises);
}

/**
 * Check if a resource has been prefetched
 * 
 * @param url - URL of the resource
 * @returns Boolean indicating if the resource has been prefetched
 */
export function isPrefetched(url: string): boolean {
  return prefetchCache.has(url);
}

/**
 * Clear the prefetch cache
 */
export function clearPrefetchCache(): void {
  prefetchCache.clear();
}

/**
 * Get the current prefetch queue length
 * 
 * @returns Number of items in the prefetch queue
 */
export function getPrefetchQueueLength(): number {
  return prefetchQueue.length;
}

export default {
  prefetchResource,
  prefetchScript,
  prefetchStylesheet,
  prefetchImage,
  prefetchFont,
  prefetchWasmModule,
  prefetchCriticalResources,
  isPrefetched,
  clearPrefetchCache,
  getPrefetchQueueLength,
  PrefetchPriority,
};
