/**
 * Utilities for prefetching resources to improve perceived performance
 */

import { isWebAssemblySupported } from '../compat';
import { getWasmModuleUrl } from '../wasm/wasmLoader';
import PerfMonitor from './perfMonitor';

// Cache to track prefetched resources
const prefetchCache = new Set<string>();

/**
 * Prefetch a resource using a fetch request
 * @param url URL of the resource to prefetch
 * @param options Fetch options
 * @returns Promise that resolves when the prefetch is complete
 */
export async function prefetchResource(url: string, options?: RequestInit): Promise<void> {
  if (prefetchCache.has(url)) {
    return;
  }

  const measureId = PerfMonitor.startMeasure(`prefetch:${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
      priority: 'low',
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`Failed to prefetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    // Just trigger the fetch, we don't need to do anything with the response
    prefetchCache.add(url);
    console.info(`[Prefetch] Successfully prefetched: ${url}`);
  } catch (error) {
    console.warn(`[Prefetch] Failed to prefetch ${url}:`, error);
  } finally {
    PerfMonitor.stopMeasure(measureId);
  }
}

/**
 * Prefetch a WebAssembly module
 * @param moduleName Name of the WebAssembly module to prefetch
 * @returns Promise that resolves when the prefetch is complete
 */
export async function prefetchWasmModule(moduleName: string): Promise<void> {
  if (!isWebAssemblySupported()) {
    console.warn(`[Prefetch] WebAssembly not supported, skipping prefetch of ${moduleName}`);
    return;
  }
  
  const url = getWasmModuleUrl(moduleName);
  if (!url) {
    console.warn(`[Prefetch] No URL found for WebAssembly module: ${moduleName}`);
    return;
  }
  
  return prefetchResource(url);
}

/**
 * Prefetch a JavaScript module
 * @param modulePath Path to the JavaScript module to prefetch
 * @returns Promise that resolves when the prefetch is complete
 */
export async function prefetchJsModule(modulePath: string): Promise<void> {
  return prefetchResource(modulePath);
}

/**
 * Prefetch an image
 * @param imageUrl URL of the image to prefetch
 * @returns Promise that resolves when the prefetch is complete
 */
export async function prefetchImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      prefetchCache.add(imageUrl);
      resolve();
    };
    img.onerror = (error) => {
      console.warn(`[Prefetch] Failed to prefetch image ${imageUrl}:`, error);
      reject(error);
    };
    img.src = imageUrl;
  });
}

/**
 * Prefetch critical resources for the application
 * @returns Promise that resolves when all critical resources are prefetched
 */
export async function prefetchCriticalResources(): Promise<void> {
  const criticalResources = [
    // Add critical WebAssembly modules
    prefetchWasmModule('ffmpeg'),
    prefetchWasmModule('opencv'),
    
    // Add critical JavaScript modules
    prefetchJsModule('/assets/vendor.js'),
    
    // Add critical images
    // prefetchImage('/assets/logo.png'),
  ];
  
  await Promise.allSettled(criticalResources);
}

export default {
  prefetchResource,
  prefetchWasmModule,
  prefetchJsModule,
  prefetchImage,
  prefetchCriticalResources
};
