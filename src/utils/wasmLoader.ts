/**
 * wasmLoader.ts
 * 
 * Utility for optimized loading of WebAssembly modules in the application.
 * Supports CDN configuration and caching for better performance.
 */

// Cache for loaded WASM modules to prevent duplicate loading
const wasmCache = new Map<string, Promise<any>>();

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
 * Load a WebAssembly module with caching and optimized loading
 * 
 * @param modulePath - Path to the WASM module relative to the base URL
 * @param options - Additional loading options
 * @returns Promise resolving to the instantiated WASM module
 */
export const loadWasmModule = async (
  modulePath: string, 
  options: {
    preload?: boolean;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<any> => {
  const { preload = false, onProgress } = options;
  
  // Create a cache key for this module
  const cacheKey = `${getWasmBaseUrl()}/${modulePath}`;
  
  // Return cached module if available
  if (wasmCache.has(cacheKey)) {
    return wasmCache.get(cacheKey);
  }
  
  // Create a loading promise
  const loadingPromise = new Promise(async (resolve, reject) => {
    try {
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
        
        // Instantiate the WebAssembly module
        const wasmModule = await WebAssembly.instantiate(allChunks);
        resolve(wasmModule.instance.exports);
      } else {
        // Simple fetch without progress tracking
        const response = await fetch(moduleUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch WASM module: ${response.status} ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        const wasmModule = await WebAssembly.instantiate(buffer);
        resolve(wasmModule.instance.exports);
      }
    } catch (error) {
      // Remove from cache on error
      wasmCache.delete(cacheKey);
      reject(error);
    }
  });
  
  // Store in cache
  wasmCache.set(cacheKey, loadingPromise);
  
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
 * Configure WebAssembly loading for the application
 * Sets up necessary headers and preloads critical modules
 */
export const configureWasmLoading = (): void => {
  // Preload critical WASM modules in production
  if (import.meta.env.PROD) {
    // List of critical modules to preload
    const criticalModules = [
      'ffmpeg-core.wasm',
      'opencv.wasm',
    ];
    
    // Preload each module
    criticalModules.forEach(module => {
      preloadWasmModule(module);
    });
  }
};

export default {
  loadWasmModule,
  preloadWasmModule,
  getWasmModuleUrl,
  configureWasmLoading,
};
