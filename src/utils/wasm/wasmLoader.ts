
/**
 * wasmLoader.ts
 * 
 * Utility for optimized loading of WebAssembly modules in the application.
 * Supports CDN configuration, caching, performance monitoring, and fallbacks.
 * Enhanced with IndexedDB caching and version checking.
 */

import { WasmModuleExports, FFmpegWasmModule, OpenCVWasmModule } from '../../types/wasm';
import { perfMonitor } from '../performance/perfMonitor';
import { supportsWebAssembly } from '../compat';
import { getBestFallback, hasFallback } from '../wasmFallback';
import { prefetchWasmModule } from '../performance/prefetch';
import * as idbKeyval from 'idb-keyval';

// Cache for loaded WASM modules to prevent duplicate loading
const wasmCache = new Map<string, Promise<WasmModuleExports>>();

// IndexedDB cache configuration
const INDEXEDDB_STORE_NAME = 'wasm-cache';
const INDEXEDDB_DB_NAME = 'cineflux-wasm-cache';
const INDEXEDDB_VERSION = 1;

// Current version of the WebAssembly modules
// Increment this when updating WASM modules to invalidate cache
const WASM_MODULE_VERSION = '1.0.0';

// Interface for cached WebAssembly module
interface CachedWasmModule {
  buffer: ArrayBuffer;
  version: string;
  timestamp: number;
}

// Get the base URL for WebAssembly modules
const getWasmBaseUrl = (): string => {
  // Use CDN URL from environment variables if available
  const cdnUrl = import.meta.env.VITE_WASM_CDN_URL;
  if (cdnUrl && import.meta.env.PROD) {
    return cdnUrl;
  }
  
  // Fallback to local path
  return '/wasm';
};

/**
 * Initialize the IndexedDB cache for WebAssembly modules
 * 
 * @returns Promise resolving to a boolean indicating if initialization was successful
 */
const initIndexedDBCache = async (): Promise<boolean> => {
  try {
    // Create a custom store for WASM modules
    const wasmStore = idbKeyval.createStore(INDEXEDDB_DB_NAME, INDEXEDDB_STORE_NAME);
    
    // Test if the store is working
    await idbKeyval.set('wasm-cache-test', true, wasmStore);
    await idbKeyval.del('wasm-cache-test', wasmStore);
    
    if (import.meta.env.DEV) {
      console.log('[WasmLoader] IndexedDB cache initialized successfully');
    }
    
    return true;
  } catch (error) {
    console.error('[WasmLoader] Failed to initialize IndexedDB cache:', error);
    return false;
  }
};

/**
 * Store a WebAssembly module in the IndexedDB cache
 * 
 * @param key - Cache key for the module
 * @param buffer - ArrayBuffer containing the module
 * @returns Promise resolving when the module is stored
 */
const storeWasmInIndexedDB = async (key: string, buffer: ArrayBuffer): Promise<void> => {
  try {
    // Create a custom store for WASM modules
    const wasmStore = idbKeyval.createStore(INDEXEDDB_DB_NAME, INDEXEDDB_STORE_NAME);
    
    // Store the module with metadata
    const cachedModule: CachedWasmModule = {
      buffer,
      version: WASM_MODULE_VERSION,
      timestamp: Date.now(),
    };
    
    await idbKeyval.set(key, cachedModule, wasmStore);
    
    if (import.meta.env.DEV) {
      console.log(`[WasmLoader] Stored ${key} in IndexedDB cache (version ${WASM_MODULE_VERSION})`);
    }
  } catch (error) {
    console.error('[WasmLoader] Failed to store WASM module in IndexedDB:', error);
  }
};

/**
 * Load a WebAssembly module from the IndexedDB cache
 * 
 * @param key - Cache key for the module
 * @returns Promise resolving to the module buffer, or null if not found or version mismatch
 */
const loadWasmFromIndexedDB = async (key: string): Promise<ArrayBuffer | null> => {
  try {
    // Create a custom store for WASM modules
    const wasmStore = idbKeyval.createStore(INDEXEDDB_DB_NAME, INDEXEDDB_STORE_NAME);
    
    // Get the cached module
    const cachedModule = await idbKeyval.get<CachedWasmModule>(key, wasmStore);
    
    if (!cachedModule) {
      return null;
    }
    
    // Check if the version matches
    if (cachedModule.version !== WASM_MODULE_VERSION) {
      if (import.meta.env.DEV) {
        console.log(`[WasmLoader] Cached module version mismatch: ${cachedModule.version} (expected ${WASM_MODULE_VERSION})`);
      }
      
      // Delete the outdated module
      await idbKeyval.del(key, wasmStore);
      return null;
    }
    
    if (import.meta.env.DEV) {
      console.log(`[WasmLoader] Loaded ${key} from IndexedDB cache (version ${cachedModule.version})`);
    }
    
    return cachedModule.buffer;
  } catch (error) {
    console.error('[WasmLoader] Failed to load WASM module from IndexedDB:', error);
    return null;
  }
};

/**
 * Preload a WebAssembly module into the IndexedDB cache
 * 
 * @param modulePath - Path to the WASM module relative to the base URL
 * @returns Promise resolving when the module is preloaded
 */
const preloadWasmIntoCache = async (modulePath: string): Promise<void> => {
  try {
    const baseUrl = getWasmBaseUrl();
    const moduleUrl = `${baseUrl}/${modulePath}`;
    const cacheKey = `wasm-${modulePath}`;
    
    // Check if the module is already cached with the correct version
    const cachedBuffer = await loadWasmFromIndexedDB(cacheKey);
    
    if (cachedBuffer) {
      // Module is already cached with the correct version
      return;
    }
    
    // Fetch the module
    const response = await fetch(moduleUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM module: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // Store in IndexedDB cache
    await storeWasmInIndexedDB(cacheKey, buffer);
    
    if (import.meta.env.DEV) {
      console.log(`[WasmLoader] Preloaded ${modulePath} into IndexedDB cache`);
    }
  } catch (error) {
    console.error(`[WasmLoader] Failed to preload ${modulePath} into IndexedDB cache:`, error);
  }
};

/**
 * Load a WebAssembly module with caching, performance monitoring, and optimized loading
 * 
 * @param modulePath - Path to the WASM module relative to the base URL
 * @param options - Additional loading options
 * @returns Promise resolving to the instantiated WASM module
 */
export const loadWasmModule = async <T extends WasmModuleExports = WasmModuleExports>(
  modulePath: string, 
  options: {
    preload?: boolean;
    onProgress?: (progress: number) => void;
    useIndexedDBCache?: boolean;
    retryCount?: number;
    retryDelay?: number;
    timeout?: number;
    useFallback?: boolean;
  } = {}
): Promise<T> => {
  const { 
    preload = false, 
    onProgress, 
    useIndexedDBCache = true,
    retryCount = 2,
    retryDelay = 2000,
    timeout = 30000,
    useFallback = true
  } = options;
  
  // Check WebAssembly support
  if (!supportsWebAssembly()) {
    if (useFallback) {
      // Get fallback implementation
      const moduleName = modulePath.includes('ffmpeg') ? 'ffmpeg' : 
                         modulePath.includes('opencv') ? 'opencv' : 
                         'unknown';
      
      const fallback = getBestFallback(moduleName);
      
      if (fallback) {
        return fallback as T;
      }
      
      throw new Error(`WebAssembly is not supported in this browser, and no fallback is available for ${moduleName}`);
    } else {
      throw new Error('WebAssembly is not supported in this browser');
    }
  }
  
  // Create a cache key for this module
  const cacheKey = `${getWasmBaseUrl()}/${modulePath}`;
  const indexedDBCacheKey = `wasm-${modulePath}`;
  
  // Return cached module if available
  if (wasmCache.has(cacheKey)) {
    return wasmCache.get(cacheKey) as Promise<T>;
  }
  
  // Start performance tracking
  perfMonitor.mark(`wasm-load-start-${modulePath}`);
  
  // Create a loading promise with timeout
  const loadingPromise = new Promise<T>(async (resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout loading WebAssembly module: ${modulePath}`));
    }, timeout);
    
    // Function to clean up timeout
    const clearTimeoutAndResolve = (result: T) => {
      clearTimeout(timeoutId);
      resolve(result);
    };
    
    const clearTimeoutAndReject = (error: Error) => {
      clearTimeout(timeoutId);
      reject(error);
    };
    
    try {
      // Try to load from IndexedDB cache first
      if (useIndexedDBCache) {
        try {
          const cachedBuffer = await loadWasmFromIndexedDB(indexedDBCacheKey);
          
          if (cachedBuffer) {
            if (import.meta.env.DEV) {
              console.log(`[WasmLoader] Loaded ${modulePath} from IndexedDB cache`);
            }
            
            // Instantiate the WebAssembly module from cache
            const wasmModule = await WebAssembly.instantiate(cachedBuffer);
            
            // End performance tracking
            perfMonitor.mark(`wasm-load-end-${modulePath}`);
            perfMonitor.measure(
              `wasm-load-${modulePath}`,
              `wasm-load-start-${modulePath}`,
              `wasm-load-end-${modulePath}`
            );
            
            clearTimeoutAndResolve(wasmModule.instance.exports as T);
            return;
          }
        } catch (error) {
          console.warn(`[WasmLoader] Failed to load ${modulePath} from IndexedDB cache:`, error);
          // Continue with network loading
        }
      }
      
      // Retry logic for network loading
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          // If not the first attempt, wait before retrying
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            if (import.meta.env.DEV) {
              console.log(`[WasmLoader] Retry ${attempt}/${retryCount} loading ${modulePath}`);
            }
            
            // Update progress callback if provided
            if (onProgress) {
              onProgress(0); // Reset progress for retry
            }
          }
          
          const baseUrl = getWasmBaseUrl();
          const moduleUrl = `${baseUrl}/${modulePath}`;
          
          // Use fetch with progress tracking if onProgress is provided
          if (onProgress) {
            const response = await fetch(moduleUrl);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch WASM module: ${response.status} ${response.statusText}`);
            }
            
            const contentLength = Number(response.headers.get('Content-Length') || '0');
            let receivedLength = 0;
            
            // Create a reader to track download progress
            const reader = response.body!.getReader();
            const chunks: Uint8Array[] = [];
            
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }
              
              chunks.push(value);
              receivedLength += value.length;
              
              if (contentLength > 0) {
                onProgress(receivedLength / contentLength);
              }
            }
            
            // Concatenate chunks into a single Uint8Array
            const allChunks = new Uint8Array(receivedLength);
            let position = 0;
            
            for (const chunk of chunks) {
              allChunks.set(chunk, position);
              position += chunk.length;
            }
            
            // Store in IndexedDB cache
            if (useIndexedDBCache) {
              storeWasmInIndexedDB(indexedDBCacheKey, allChunks.buffer).catch(error => {
                console.warn(`[WasmLoader] Failed to store ${modulePath} in IndexedDB cache:`, error);
              });
            }
            
            // Instantiate the WebAssembly module
            const wasmModule = await WebAssembly.instantiate(allChunks);
            
            // End performance tracking
            perfMonitor.mark(`wasm-load-end-${modulePath}`);
            perfMonitor.measure(
              `wasm-load-${modulePath}`,
              `wasm-load-start-${modulePath}`,
              `wasm-load-end-${modulePath}`
            );
            
            clearTimeoutAndResolve(wasmModule.instance.exports as T);
            return;
          } else {
            // Simple fetch without progress tracking
            const response = await fetch(moduleUrl);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch WASM module: ${response.status} ${response.statusText}`);
            }
            
            const buffer = await response.arrayBuffer();
            
            // Store in IndexedDB cache
            if (useIndexedDBCache) {
              storeWasmInIndexedDB(indexedDBCacheKey, buffer).catch(error => {
                console.warn(`[WasmLoader] Failed to store ${modulePath} in IndexedDB cache:`, error);
              });
            }
            
            const wasmModule = await WebAssembly.instantiate(buffer);
            
            // End performance tracking
            perfMonitor.mark(`wasm-load-end-${modulePath}`);
            perfMonitor.measure(
              `wasm-load-${modulePath}`,
              `wasm-load-start-${modulePath}`,
              `wasm-load-end-${modulePath}`
            );
            
            clearTimeoutAndResolve(wasmModule.instance.exports as T);
            return;
          }
        } catch (error) {
          lastError = error as Error;
          
          if (import.meta.env.DEV) {
            console.warn(`[WasmLoader] Attempt ${attempt + 1}/${retryCount + 1} failed to load ${modulePath}:`, error);
          }
        }
      }
      
      // If all retries failed, try fallback if enabled
      if (useFallback) {
        const moduleName = modulePath.includes('ffmpeg') ? 'ffmpeg' : 
                           modulePath.includes('opencv') ? 'opencv' : 
                           'unknown';
        
        const fallback = getBestFallback(moduleName);
        
        if (fallback) {
          if (import.meta.env.DEV) {
            console.log(`[WasmLoader] Using fallback for ${modulePath}`);
          }
          
          clearTimeoutAndResolve(fallback as T);
          return;
        }
      }
      
      // If all retries failed and no fallback, throw the last error
      throw lastError || new Error(`Failed to load WebAssembly module: ${modulePath}`);
    } catch (error) {
      // Remove from cache on error
      wasmCache.delete(cacheKey);
      clearTimeoutAndReject(error as Error);
    }
  });
  
  // Store in cache
  wasmCache.set(cacheKey, loadingPromise as Promise<WasmModuleExports>);
  
  // Preload the module if requested
  if (preload) {
    loadingPromise.catch(() => {
      // Silently handle preload errors
      wasmCache.delete(cacheKey);
    });
  }
  
  return loadingPromise;
};

/**
 * Load FFmpeg WebAssembly module
 * 
 * @param options - Additional loading options
 * @returns Promise resolving to the FFmpeg WASM module
 */
export const loadFFmpegModule = (
  options: {
    preload?: boolean;
    onProgress?: (progress: number) => void;
    useIndexedDBCache?: boolean;
    retryCount?: number;
    retryDelay?: number;
    timeout?: number;
    useFallback?: boolean;
  } = {}
): Promise<FFmpegWasmModule> => {
  return loadWasmModule<FFmpegWasmModule>('ffmpeg-core.wasm', options);
};

/**
 * Load OpenCV WebAssembly module
 * 
 * @param options - Additional loading options
 * @returns Promise resolving to the OpenCV WASM module
 */
export const loadOpenCVModule = (
  options: {
    preload?: boolean;
    onProgress?: (progress: number) => void;
    useIndexedDBCache?: boolean;
    retryCount?: number;
    retryDelay?: number;
    timeout?: number;
    useFallback?: boolean;
  } = {}
): Promise<OpenCVWasmModule> => {
  return loadWasmModule<OpenCVWasmModule>('opencv.wasm', options);
};

/**
 * Preload a WebAssembly module without waiting for it to complete
 * 
 * @param modulePath - Path to the WASM module relative to the base URL
 */
export const preloadWasmModule = (modulePath: string): void => {
  // First, try to preload into IndexedDB cache
  preloadWasmIntoCache(modulePath).catch(() => {
    // Silently handle preload errors
  });
  
  // Also load into memory cache
  loadWasmModule(modulePath, { preload: true }).catch(() => {
    // Silently handle preload errors
  });
};

/**
 * Get the URL for a WebAssembly module
 * 
 * @param modulePath - Path to the WASM module relative to the base URL
 * @returns Full URL to the WASM module
 */
export const getWasmModuleUrl = (modulePath: string): string => {
  return `${getWasmBaseUrl()}/${modulePath}`;
};

/**
 * Check if a WebAssembly module is available (either natively or via fallback)
 * 
 * @param moduleName - Name of the module (e.g., 'ffmpeg', 'opencv')
 * @returns Boolean indicating if the module is available
 */
export const isWasmModuleAvailable = (moduleName: string): boolean => {
  return supportsWebAssembly() || hasFallback(moduleName);
};

/**
 * Configure WebAssembly loading for the application
 * Sets up necessary headers and preloads critical modules
 */
export const configureWasmLoading = async (): Promise<void> => {
  // Skip if WebAssembly is not supported and no fallbacks are available
  if (!supportsWebAssembly() && 
      !hasFallback('ffmpeg') && 
      !hasFallback('opencv')) {
    console.warn('[WasmLoader] WebAssembly is not supported and no fallbacks are available');
    return;
  }
  
  // Initialize IndexedDB cache
  const cacheInitialized = await initIndexedDBCache();
  
  // Critical WASM modules to preload
  const criticalModules = [
    'ffmpeg-core.wasm',
    'opencv.wasm',
  ];
  
  // Frequently used modules that should be preloaded but are not critical
  const frequentlyUsedModules = [
    // Add any additional modules here
  ];
  
  // In production, use prefetch links for better performance
  if (import.meta.env.PROD) {
    // Prefetch critical modules with high priority
    criticalModules.forEach(module => {
      prefetchWasmModule(module);
    });
    
    // Prefetch frequently used modules with medium priority
    frequentlyUsedModules.forEach(module => {
      prefetchWasmModule(module);
    });
  }
  
  // If IndexedDB cache is available, preload modules into it
  if (cacheInitialized) {
    // Preload critical modules into IndexedDB cache
    for (const module of criticalModules) {
      preloadWasmIntoCache(module).catch(error => {
        console.warn(`[WasmLoader] Failed to preload ${module} into IndexedDB cache:`, error);
      });
    }
  }
};

/**
 * Clear the WebAssembly module cache
 * 
 * @returns Promise resolving when the cache is cleared
 */
export const clearWasmCache = async (): Promise<void> => {
  // Clear memory cache
  wasmCache.clear();
  
  try {
    // Clear IndexedDB cache
    const wasmStore = idbKeyval.createStore(INDEXEDDB_DB_NAME, INDEXEDDB_STORE_NAME);
    await idbKeyval.clear(wasmStore);
    
    if (import.meta.env.DEV) {
      console.log('[WasmLoader] WebAssembly cache cleared');
    }
  } catch (error) {
    console.error('[WasmLoader] Failed to clear IndexedDB cache:', error);
  }
};

export default {
  loadWasmModule,
  loadFFmpegModule,
  loadOpenCVModule,
  preloadWasmModule,
  getWasmModuleUrl,
  configureWasmLoading,
  isWasmModuleAvailable,
  clearWasmCache,
};
