
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
 */

import { getWasmModuleUrl } from './wasmLoader';
import { perfMonitor } from './perfMonitor';

// Cache to track prefetched resources
const prefetchCache = new Set<string>();

/**
 * Prefetch a resource using a link element
 * 
 * @param url - URL of the resource to prefetch
 * @param options - Prefetch options
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchResource(
  url: string,
  options: {
    as?: 'script' | 'style' | 'image' | 'font' | 'fetch';
    type?: string;
    importance?: 'high' | 'low' | 'auto';
    crossOrigin?: 'anonymous' | 'use-credentials';
  } = {}
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
 * Prefetch a JavaScript module
 * 
 * @param url - URL of the JavaScript module to prefetch
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchScript(url: string): Promise<void> {
  return prefetchResource(url, { as: 'script', importance: 'high' });
}

/**
 * Prefetch a CSS stylesheet
 * 
 * @param url - URL of the CSS stylesheet to prefetch
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchStylesheet(url: string): Promise<void> {
  return prefetchResource(url, { as: 'style' });
}

/**
 * Prefetch an image
 * 
 * @param url - URL of the image to prefetch
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchImage(url: string): Promise<void> {
  return prefetchResource(url, { as: 'image' });
}

/**
 * Prefetch a font
 * 
 * @param url - URL of the font to prefetch
 * @param fontFormat - Format of the font (e.g., 'woff2', 'woff', 'ttf')
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchFont(url: string, fontFormat: string): Promise<void> {
  return prefetchResource(url, { 
    as: 'font', 
    type: `font/${fontFormat}`,
    crossOrigin: 'anonymous'
  });
}

/**
 * Prefetch a WebAssembly module
 * 
 * @param modulePath - Path to the WebAssembly module
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchWasmModule(modulePath: string): Promise<void> {
  const url = getWasmModuleUrl(modulePath);
  return prefetchResource(url, { 
    as: 'fetch',
    crossOrigin: 'anonymous',
    importance: 'high'
  });
}

/**
 * Prefetch critical resources for the application
 * 
 * @param resources - List of resources to prefetch
 * @returns Promise that resolves when all prefetches are complete
 */
export function prefetchCriticalResources(resources: {
  scripts?: string[];
  stylesheets?: string[];
  images?: string[];
  wasmModules?: string[];
}): Promise<void[]> {
  const promises: Promise<void>[] = [];
  
  // Prefetch scripts
  if (resources.scripts) {
    resources.scripts.forEach(url => {
      promises.push(prefetchScript(url));
    });
  }
  
  // Prefetch stylesheets
  if (resources.stylesheets) {
    resources.stylesheets.forEach(url => {
      promises.push(prefetchStylesheet(url));
    });
  }
  
  // Prefetch images
  if (resources.images) {
    resources.images.forEach(url => {
      promises.push(prefetchImage(url));
    });
  }
  
  // Prefetch WebAssembly modules
  if (resources.wasmModules) {
    resources.wasmModules.forEach(modulePath => {
      promises.push(prefetchWasmModule(modulePath));
    });
  }
  
  return Promise.all(promises);
}

export default {
  prefetchResource,
  prefetchScript,
  prefetchStylesheet,
  prefetchImage,
  prefetchFont,
  prefetchWasmModule,
  prefetchCriticalResources,
};
