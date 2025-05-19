/**
 * Lazy WebAssembly module loading utilities
 * This implementation improves performance by loading WASM modules only when needed
 */

import { v4 as uuidv4 } from 'uuid';
import { WasmModuleExports, FFmpegWasmModule, OpenCVWasmModule, WasmLoadingProgress } from '../../types/wasm';
import PerfMonitor from '../performance/perfMonitor';
import { isWebAssemblySupported } from '../compat';
import { executeWithFallback, WasmFallbackStrategy } from '../wasmFallback';

// Constants for WebAssembly loading
const WASM_CACHE_PREFIX = 'wasm-cache-';
const INDEXEDDB_NAME = 'wasm-cache';
const INDEXEDDB_VERSION = 1;
const WASM_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache for loaded WebAssembly modules
const moduleCache = new Map<string, WebAssembly.Module>();
const instanceCache = new Map<string, any>();
const moduleLoadPromises = new Map<string, Promise<any>>();

// CDN URL for WebAssembly modules
const WASM_CDN_URL = import.meta.env.VITE_WASM_CDN_URL || '';

/**
 * Get the URL for a WebAssembly module
 * @param moduleName Name of the WebAssembly module
 * @returns URL for the WebAssembly module
 */
export function getWasmModuleUrl(moduleName: string): string {
  // Use CDN URL if available, otherwise use local path
  if (WASM_CDN_URL) {
    return `${WASM_CDN_URL}/${moduleName}.wasm`;
  }
  
  return `/wasm/${moduleName}.wasm`;
}

/**
 * Load a WebAssembly module from a URL
 * @param url URL of the WebAssembly module
 * @param imports Imports for the WebAssembly module
 * @param onProgress Progress callback
 * @returns Promise that resolves to the WebAssembly instance
 */
export async function loadWasmModule(
  url: string,
  imports: WebAssembly.Imports = {},
  onProgress?: (progress: WasmLoadingProgress) => void
): Promise<any> {
  // Check if module is already being loaded
  const cacheKey = `${url}`;
  if (moduleLoadPromises.has(cacheKey)) {
    return moduleLoadPromises.get(cacheKey);
  }
  
  // Create a new loading promise
  const loadPromise = executeWithFallback(async () => {
    if (!isWebAssemblySupported()) {
      throw new Error('WebAssembly is not supported in this browser');
    }
    
    const measureId = PerfMonitor.startMeasure(`loadWasm:${url}`);
    
    try {
      // Check if module is already cached in memory
      if (instanceCache.has(cacheKey)) {
        return instanceCache.get(cacheKey);
      }
      
      // Try to load from IndexedDB cache first
      try {
        const cachedModule = await loadWasmModuleFromCache(url);
        if (cachedModule) {
          const instance = await WebAssembly.instantiate(cachedModule, imports);
          instanceCache.set(cacheKey, instance.exports);
          return instance.exports;
        }
      } catch (error) {
        console.warn(`[LazyWasmLoader] Failed to load from cache, falling back to network: ${error}`);
      }
      
      // Fetch the WebAssembly module
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch WebAssembly module: ${response.status} ${response.statusText}`);
      }
      
      // Get total size for progress reporting
      const totalBytes = Number(response.headers.get('content-length')) || 0;
      let loadedBytes = 0;
      
      // Create a readable stream from the response
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      
      // Read the response in chunks and report progress
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        chunks.push(value);
        loadedBytes += value.length;
        
        if (onProgress && totalBytes > 0) {
          onProgress({
            moduleName: url.split('/').pop() || url,
            bytesLoaded: loadedBytes,
            bytesTotal: totalBytes,
            percentage: Math.round((loadedBytes / totalBytes) * 100)
          });
        }
      }
      
      // Combine chunks into a single ArrayBuffer
      const wasmBytes = new Uint8Array(loadedBytes);
      let offset = 0;
      
      for (const chunk of chunks) {
        wasmBytes.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Compile and instantiate the WebAssembly module
      const module = await WebAssembly.compile(wasmBytes);
      const instance = await WebAssembly.instantiate(module, imports);
      
      // Cache the instance
      instanceCache.set(cacheKey, instance.exports);
      
      // Try to cache the module in IndexedDB for future use
      try {
        await cacheWasmModule(url, module);
      } catch (error) {
        console.warn(`Failed to cache WebAssembly module ${url}:`, error);
      }
      
      return instance.exports;
    } finally {
      PerfMonitor.stopMeasure(measureId);
    }
  }, {
    strategy: WasmFallbackStrategy.ERROR,
    errorMessage: 'WebAssembly is required for this feature but is not supported in your browser.'
  });
  
  // Store the loading promise in the cache
  moduleLoadPromises.set(cacheKey, loadPromise);
  
  // Clean up the promise cache when done
  loadPromise.finally(() => {
    moduleLoadPromises.delete(cacheKey);
  });
  
  return loadPromise;
}

/**
 * Cache a WebAssembly module in IndexedDB
 * @param url URL of the WebAssembly module
 * @param module Compiled WebAssembly module
 * @returns Promise that resolves when the module is cached
 */
async function cacheWasmModule(url: string, module: WebAssembly.Module): Promise<void> {
  // Skip caching in development mode
  if (import.meta.env.DEV) {
    return;
  }
  
  const cacheKey = `${WASM_CACHE_PREFIX}${url}`;
  
  // Try to use IndexedDB for persistent caching
  try {
    const db = await openWasmCache();
    const transaction = db.transaction(['modules'], 'readwrite');
    const store = transaction.objectStore('modules');
    
    // Store the module with metadata
    await store.put({
      key: cacheKey,
      module: module,
      timestamp: Date.now(),
      url: url
    });
    
    console.info(`[LazyWasmLoader] Cached WebAssembly module: ${url}`);
  } catch (error) {
    console.warn(`[LazyWasmLoader] Failed to cache WebAssembly module in IndexedDB:`, error);
    
    // Fall back to memory cache
    moduleCache.set(cacheKey, module);
  }
}

/**
 * Load a WebAssembly module from cache
 * @param url URL of the WebAssembly module
 * @returns Promise that resolves to the cached WebAssembly module, or null if not found
 */
async function loadWasmModuleFromCache(url: string): Promise<WebAssembly.Module | null> {
  const cacheKey = `${WASM_CACHE_PREFIX}${url}`;
  
  // Check memory cache first
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)!;
  }
  
  // Try to load from IndexedDB
  try {
    const db = await openWasmCache();
    const transaction = db.transaction(['modules'], 'readonly');
    const store = transaction.objectStore('modules');
    const result = await store.get(cacheKey);
    
    if (result && result.module) {
      // Check if the cache entry is expired
      if (Date.now() - result.timestamp > WASM_CACHE_EXPIRY) {
        console.info(`[LazyWasmLoader] Cached WebAssembly module expired: ${url}`);
        return null;
      }
      
      console.info(`[LazyWasmLoader] Loaded WebAssembly module from cache: ${url}`);
      return result.module;
    }
  } catch (error) {
    console.warn(`[LazyWasmLoader] Failed to load WebAssembly module from IndexedDB:`, error);
  }
  
  return null;
}

/**
 * Open the WebAssembly cache database
 * @returns Promise that resolves to the IndexedDB database
 */
function openWasmCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Skip IndexedDB in development mode
    if (import.meta.env.DEV) {
      reject(new Error('IndexedDB is disabled in development mode'));
      return;
    }
    
    try {
      const request = indexedDB.open(INDEXEDDB_NAME, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for WebAssembly modules
        if (!db.objectStoreNames.contains('modules')) {
          db.createObjectStore('modules', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      
      request.onerror = (event) => {
        reject(new Error(`Failed to open WebAssembly cache: ${(event.target as IDBOpenDBRequest).error}`));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create a lazy loader for a WebAssembly module
 * @param moduleName Name of the WebAssembly module
 * @param importsFn Function that returns imports for the WebAssembly module
 * @returns Object with load method that loads the module on demand
 */
export function createLazyWasmLoader<T>(
  moduleName: string,
  importsFn: () => WebAssembly.Imports = () => ({})
) {
  let modulePromise: Promise<T> | null = null;
  
  return {
    /**
     * Load the WebAssembly module on demand
     * @param onProgress Progress callback
     * @returns Promise that resolves to the WebAssembly module
     */
    load: (onProgress?: (progress: WasmLoadingProgress) => void): Promise<T> => {
      // Return existing promise if module is already being loaded
      if (modulePromise) {
        return modulePromise;
      }
      
      // Create a new loading promise
      modulePromise = loadWasmModule(
        getWasmModuleUrl(moduleName),
        importsFn(),
        onProgress
      ) as Promise<T>;
      
      return modulePromise;
    },
    
    /**
     * Check if the module is already loaded
     * @returns True if the module is loaded, false otherwise
     */
    isLoaded: (): boolean => {
      return instanceCache.has(getWasmModuleUrl(moduleName));
    },
    
    /**
     * Preload the WebAssembly module
     * @param onProgress Progress callback
     * @returns Promise that resolves when the module is preloaded
     */
    preload: (onProgress?: (progress: WasmLoadingProgress) => void): Promise<void> => {
      return loadWasmModule(
        getWasmModuleUrl(moduleName),
        importsFn(),
        onProgress
      ).then(() => {});
    }
  };
}

/**
 * Lazy loader for FFmpeg WebAssembly module
 */
export const FFmpegLoader = createLazyWasmLoader<FFmpegWasmModule>('ffmpeg-core', () => ({
  env: {
    memory: new WebAssembly.Memory({ initial: 256, maximum: 2048, shared: true }),
    // Add any required FFmpeg imports here
  }
}));

/**
 * Lazy loader for OpenCV WebAssembly module
 */
export const OpenCVLoader = createLazyWasmLoader<OpenCVWasmModule>('opencv', () => ({
  env: {
    memory: new WebAssembly.Memory({ initial: 256, maximum: 2048 }),
    // Add any required OpenCV imports here
  }
}));

export default {
  loadWasmModule,
  getWasmModuleUrl,
  FFmpegLoader,
  OpenCVLoader,
  createLazyWasmLoader
};
