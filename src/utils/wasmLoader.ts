/**
 * wasmLoader.ts
 * 
 * Utility for optimized loading of WebAssembly modules in the application.
 * Supports CDN configuration, caching, performance monitoring, and fallbacks.
 */

import { WasmModuleExports, FFmpegWasmModule, OpenCVWasmModule } from '../types/wasm';
import { perfMonitor } from './perfMonitor';
import { supportsWebAssembly } from './compat';
import { getBestFallback, hasFallback } from './wasmFallback';
import { prefetchWasmModule } from './prefetch';

// Cache for loaded WASM modules to prevent duplicate loading
const wasmCache = new Map<string, Promise<WasmModuleExports>>();

// IndexedDB cache configuration
const INDEXEDDB_STORE_NAME = 'wasm-cache';
const INDEXEDDB_DB_NAME = 'cineflux-wasm-cache';
const INDEXEDDB_VERSION = 1;

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
 * @returns Promise resolving to the IndexedDB database
 */
const initIndexedDBCache = async (): Promise<IDBDatabase | null> => {
  // Skip if IndexedDB is not supported
  if (typeof indexedDB === 'undefined') {
    return null;
  }
  
  return new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(INDEXEDDB_DB_NAME, INDEXEDDB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for WASM modules if it doesn't exist
        if (!db.objectStoreNames.contains(INDEXEDDB_STORE_NAME)) {
          db.createObjectStore(INDEXEDDB_STORE_NAME);
        }
      };
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      
      request.onerror = (event) => {
        console.error('Failed to initialize IndexedDB cache:', event);
        resolve(null);
      };
    } catch (error) {
      console.error('Error initializing IndexedDB cache:', error);
      resolve(null);
    }
  });
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
    const db = await initIndexedDBCache();
    
    if (!db) {
      return;
    }
    
    return new Promise<void>((resolve) => {
      const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
      
      // Store the module with metadata
      const request = store.put({
        buffer,
        timestamp: Date.now(),
      }, key);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Failed to store WASM module in IndexedDB:', event);
        resolve();
      };
    });
  } catch (error) {
    console.error('Error storing WASM module in IndexedDB:', error);
  }
};

/**
 * Load a WebAssembly module from the IndexedDB cache
 * 
 * @param key - Cache key for the module
 * @returns Promise resolving to the module buffer, or null if not found
 */
const loadWasmFromIndexedDB = async (key: string): Promise<ArrayBuffer | null> => {
  try {
    const db = await initIndexedDBCache();
    
    if (!db) {
      return null;
    }
    
    return new Promise<ArrayBuffer | null>((resolve) => {
      const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readonly');
      const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
      
      const request = store.get(key);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        
        if (result && result.buffer) {
          resolve(result.buffer);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error('Failed to load WASM module from IndexedDB:', event);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Error loading WASM module from IndexedDB:', error);
    return null;
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
          const cachedBuffer = await loadWasmFromIndexedDB(cacheKey);
          
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
              storeWasmInIndexedDB(cacheKey, allChunks.buffer).catch(error => {
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
              storeWasmInIndexedDB(cacheKey, buffer).catch(error => {
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
export const configureWasmLoading = (): void => {
  // Skip if WebAssembly is not supported and no fallbacks are available
  if (!supportsWebAssembly() && 
      !hasFallback('ffmpeg') && 
      !hasFallback('opencv')) {
    console.warn('[WasmLoader] WebAssembly is not supported and no fallbacks are available');
    return;
  }
  
  // Preload critical WASM modules
  const criticalModules = [
    'ffmpeg-core.wasm',
    'opencv.wasm',
  ];
  
  // In production, use prefetch links for better performance
  if (import.meta.env.PROD) {
    criticalModules.forEach(module => {
      prefetchWasmModule(module);
    });
  } else {
    // In development, preload modules without prefetch links
    criticalModules.forEach(module => {
      preloadWasmModule(module);
    });
  }
  
  // Initialize IndexedDB cache
  initIndexedDBCache().catch(error => {
    console.warn('[WasmLoader] Failed to initialize IndexedDB cache:', error);
  });
};

export default {
  loadWasmModule,
  loadFFmpegModule,
  loadOpenCVModule,
  preloadWasmModule,
  getWasmModuleUrl,
  configureWasmLoading,
  isWasmModuleAvailable,
};
