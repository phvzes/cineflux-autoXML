
/**
 * WebAssembly Loader Utility
 * Provides consistent loading mechanisms for WebAssembly modules
 */

// Track loaded modules to prevent duplicate loading
const loadedModules: Record<string, boolean> = {};

/**
 * Loads a WebAssembly module from a URL
 * @param url The URL of the WebAssembly module
 * @param importObject Optional import object for the WebAssembly module
 * @returns A promise that resolves to the instantiated WebAssembly module
 */
export async function loadWasmModule(
  url: string,
  importObject: WebAssembly.Imports = {}
): Promise<WebAssembly.Instance> {
  try {
    // Check if the browser supports WebAssembly
    if (typeof WebAssembly === 'undefined') {
      throw new Error('WebAssembly is not supported in this browser');
    }

    // Fetch the WebAssembly module
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch WebAssembly module: ${response.statusText}`);
    }

    // Get the WebAssembly module as an ArrayBuffer
    const wasmBuffer = await response.arrayBuffer();

    // Compile and instantiate the WebAssembly module
    const wasmModule = await WebAssembly.compile(wasmBuffer);
    const instance = await WebAssembly.instantiate(wasmModule, importObject);

    // Mark the module as loaded
    loadedModules[url] = true;

    return instance;
  } catch (error) {
    console.error(`Error loading WebAssembly module from ${url}:`, error);
    throw error;
  }
}

/**
 * Checks if a WebAssembly module is loaded
 * @param url The URL of the WebAssembly module
 * @returns True if the module is loaded, false otherwise
 */
export function isWasmModuleLoaded(url: string): boolean {
  return !!loadedModules[url];
}

/**
 * Gets the base URL for WebAssembly modules based on the current environment
 * @param moduleName The name of the module (e.g., 'ffmpeg', 'opencv')
 * @returns The base URL for the module's WebAssembly files
 */
export function getWasmBaseUrl(moduleName: string): string {
  // In development, use the local files
  if (import.meta.env.DEV) {
    return `/assets/${moduleName}-core/`;
  }

  // In production, use the deployed files
  return `/assets/${moduleName}-core/`;
}

/**
 * Loads FFmpeg WebAssembly module
 * @param ffmpeg The FFmpeg instance to load
 * @returns A promise that resolves when FFmpeg is loaded
 */
export async function loadFFmpeg(ffmpeg: any): Promise<void> {
  const baseUrl = getWasmBaseUrl('ffmpeg');
  
  try {
    await ffmpeg.load({
      coreURL: `${baseUrl}ffmpeg-core.js`,
      wasmURL: `${baseUrl}ffmpeg-core.wasm`,
      workerURL: `${baseUrl}ffmpeg-core.worker.js`,
    });
    console.log('FFmpeg loaded successfully');
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('Failed to load video processing library');
  }
}

/**
 * Ensures OpenCV.js is loaded and ready to use
 * @returns A promise that resolves when OpenCV.js is ready
 */
export function ensureOpenCVLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If cv.Mat exists, OpenCV is already loaded
    if (window.cv && window.cv.Mat) {
      resolve();
      return;
    }

    // Set a timeout to reject the promise if OpenCV doesn't load
    const timeoutId = setTimeout(() => {
      reject(new Error('OpenCV.js failed to load within timeout'));
    }, 30000);

    // Set the callback for when OpenCV is ready
    window.cv = window.cv || {};
    window.cv.onRuntimeInitialized = () => {
      clearTimeout(timeoutId);
      resolve();
    };
  });
}
