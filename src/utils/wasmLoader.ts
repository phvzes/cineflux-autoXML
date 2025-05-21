/**
 * WASM Loader Utility
 * 
 * Provides functionality for loading, initializing, and managing WebAssembly modules
 * within the CineFlux-AutoXML system. Handles module instantiation, memory management,
 * and function exports to enable high-performance processing capabilities.
 * 
 * @module utils/wasmLoader
 */

// Track loaded modules to prevent duplicate loading
const loadedModules: Record<string, boolean> = {};

/**
 * Represents a WebAssembly module instance with its exports and memory
 */
export interface WasmModuleInstance {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
  memory: WebAssembly.Memory;
  exports: any;
}

/**
 * Options for initializing a WebAssembly module
 */
export interface InitOptions {
  /** Memory configuration for the module */
  memory?: {
    /** Initial memory size in pages (64KB per page) */
    initial?: number;
    /** Maximum memory size in pages (64KB per page) */
    maximum?: number;
  };
  /** Enable debug mode for additional logging */
  debug?: boolean;
}

/**
 * Error thrown when a WebAssembly module fails to load
 */
export class WasmLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WasmLoadError';
  }
}

/**
 * Error thrown when a WebAssembly module fails to initialize
 */
export class WasmInitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WasmInitError';
  }
}

/**
 * Error thrown when a WebAssembly memory operation fails
 */
export class WasmMemoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WasmMemoryError';
  }
}

/**
 * Error thrown when a WebAssembly function call fails
 */
export class WasmFunctionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WasmFunctionError';
  }
}

/**
 * Loads a WebAssembly module from the specified path with optional import objects
 * 
 * @param path - Path to the WebAssembly (.wasm) file
 * @param importObject - Object containing values to be imported into the WebAssembly module
 * @returns Promise resolving to the instantiated WebAssembly module
 * @throws {WasmLoadError} If the module fails to load
 */
export async function loadWasmModule(
  path: string,
  importObject?: WebAssembly.Imports
): Promise<WasmModuleInstance> {
  try {
    // Check if the browser supports WebAssembly
    if (typeof WebAssembly === 'undefined') {
      throw new WasmLoadError('WebAssembly is not supported in this browser');
    }

    // Check if module is already loaded
    if (loadedModules[path]) {
      console.log(`WebAssembly module ${path} already loaded`);
    }
    
    const response = await fetch(path);
    if (!response.ok) {
      throw new WasmLoadError(`Failed to fetch WebAssembly module: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.compile(buffer);
    
    // Create default import object if none provided
    const imports = importObject || {};
    
    // Ensure memory is available
    if (!imports.env) {
      imports.env = {};
    }
    
    if (!imports.env.memory) {
      imports.env.memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
    }
    
    const instance = await WebAssembly.instantiate(module, imports);
    
    // Mark the module as loaded
    loadedModules[path] = true;
    
    return {
      instance,
      module,
      memory: imports.env.memory,
      exports: instance.exports
    };
  } catch (error) {
    if (error instanceof WasmLoadError) {
      throw error;
    }
    throw new WasmLoadError(`Failed to load WebAssembly module: ${error.message}`);
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
 * Initializes a loaded WebAssembly module with the provided options
 * 
 * @param module - The WebAssembly module instance
 * @param options - Initialization options
 * @returns Promise resolving to true when initialization is complete
 * @throws {WasmInitError} If the module fails to initialize
 */
export async function initializeModule(
  module: WasmModuleInstance,
  options: InitOptions = {}
): Promise<boolean> {
  try {
    // Configure memory if specified
    if (options.memory) {
      const { initial = 10, maximum = 100 } = options.memory;
      
      // Create new memory if needed
      if (initial !== 10 || maximum !== 100) {
        module.memory = new WebAssembly.Memory({ initial, maximum });
        
        // Update memory reference in exports if possible
        if (module.exports.__setMemory) {
          module.exports.__setMemory(module.memory);
        }
      }
    }
    
    // Call initialization function if it exists
    if (typeof module.exports.__initialize === 'function') {
      const result = module.exports.__initialize(options.debug ? 1 : 0);
      
      // Handle synchronous or asynchronous initialization
      if (result instanceof Promise) {
        await result;
      }
    }
    
    return true;
  } catch (error) {
    throw new WasmInitError(`Failed to initialize WebAssembly module: ${error.message}`);
  }
}

/**
 * Calls a function in the WebAssembly module with the provided arguments
 * 
 * @param module - The WebAssembly module instance
 * @param functionName - Name of the function to call
 * @param args - Arguments to pass to the function
 * @returns Promise resolving to the result of the function call
 * @throws {WasmFunctionError} If the function call fails
 */
export async function callWasmFunction(
  module: WasmModuleInstance,
  functionName: string,
  ...args: any[]
): Promise<any> {
  try {
    const func = module.exports[functionName];
    
    if (typeof func !== 'function') {
      throw new WasmFunctionError(`Function '${functionName}' not found in WebAssembly module`);
    }
    
    const result = func(...args);
    
    // Handle synchronous or asynchronous function calls
    if (result instanceof Promise) {
      return await result;
    }
    
    return result;
  } catch (error) {
    if (error instanceof WasmFunctionError) {
      throw error;
    }
    throw new WasmFunctionError(`Failed to call WebAssembly function '${functionName}': ${error.message}`);
  }
}

/**
 * Allocates memory in the WebAssembly module's heap
 * 
 * @param module - The WebAssembly module instance
 * @param size - Size of memory to allocate in bytes
 * @returns Pointer to the allocated memory
 * @throws {WasmMemoryError} If memory allocation fails
 */
export function allocateMemory(
  module: WasmModuleInstance,
  size: number
): number {
  try {
    // Use module's allocator if available
    if (typeof module.exports.__malloc === 'function') {
      return module.exports.__malloc(size);
    }
    
    // Use module's heap allocator if available
    if (typeof module.exports.__heap_allocate === 'function') {
      return module.exports.__heap_allocate(size);
    }
    
    throw new WasmMemoryError('No memory allocation function found in WebAssembly module');
  } catch (error) {
    if (error instanceof WasmMemoryError) {
      throw error;
    }
    throw new WasmMemoryError(`Failed to allocate WebAssembly memory: ${error.message}`);
  }
}

/**
 * Frees previously allocated memory in the WebAssembly module's heap
 * 
 * @param module - The WebAssembly module instance
 * @param pointer - Pointer to the memory to free
 * @returns True if memory was successfully freed
 * @throws {WasmMemoryError} If memory deallocation fails
 */
export function freeMemory(
  module: WasmModuleInstance,
  pointer: number
): boolean {
  try {
    // Use module's deallocator if available
    if (typeof module.exports.__free === 'function') {
      module.exports.__free(pointer);
      return true;
    }
    
    // Use module's heap deallocator if available
    if (typeof module.exports.__heap_free === 'function') {
      module.exports.__heap_free(pointer);
      return true;
    }
    
    throw new WasmMemoryError('No memory deallocation function found in WebAssembly module');
  } catch (error) {
    if (error instanceof WasmMemoryError) {
      throw error;
    }
    throw new WasmMemoryError(`Failed to free WebAssembly memory: ${error.message}`);
  }
}

/**
 * Copies data from JavaScript to the WebAssembly module's memory
 * 
 * @param module - The WebAssembly module instance
 * @param data - Data to copy
 * @param pointer - Pointer to copy to, or null to allocate new memory
 * @returns Pointer to the memory where data was copied
 * @throws {WasmMemoryError} If memory copy fails
 */
export function copyToWasmMemory(
  module: WasmModuleInstance,
  data: Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array,
  pointer: number | null = null
): number {
  try {
    // Allocate memory if pointer not provided
    const targetPointer = pointer !== null ? pointer : allocateMemory(module, data.byteLength);
    
    // Get memory view
    let memoryView;
    if (data instanceof Uint8Array || data instanceof Int8Array) {
      memoryView = new Uint8Array(module.memory.buffer, targetPointer, data.byteLength);
    } else if (data instanceof Uint16Array || data instanceof Int16Array) {
      memoryView = new Uint16Array(module.memory.buffer, targetPointer, data.length);
    } else if (data instanceof Uint32Array || data instanceof Int32Array) {
      memoryView = new Uint32Array(module.memory.buffer, targetPointer, data.length);
    } else if (data instanceof Float32Array) {
      memoryView = new Float32Array(module.memory.buffer, targetPointer, data.length);
    } else if (data instanceof Float64Array) {
      memoryView = new Float64Array(module.memory.buffer, targetPointer, data.length);
    } else {
      throw new WasmMemoryError('Unsupported data type for copying to WebAssembly memory');
    }
    
    // Copy data
    memoryView.set(data);
    
    return targetPointer;
  } catch (error) {
    if (error instanceof WasmMemoryError) {
      throw error;
    }
    throw new WasmMemoryError(`Failed to copy data to WebAssembly memory: ${error.message}`);
  }
}

/**
 * Copies data from the WebAssembly module's memory to JavaScript
 * 
 * @param module - The WebAssembly module instance
 * @param pointer - Pointer to the memory to copy from
 * @param length - Length of data to copy in bytes
 * @param type - Type of array to create ('Int8Array', 'Uint8Array', etc.)
 * @returns The copied data
 * @throws {WasmMemoryError} If memory copy fails
 */
export function copyFromWasmMemory(
  module: WasmModuleInstance,
  pointer: number,
  length: number,
  type: 'Int8Array' | 'Uint8Array' | 'Int16Array' | 'Uint16Array' | 'Int32Array' | 'Uint32Array' | 'Float32Array' | 'Float64Array' = 'Uint8Array'
): Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array {
  try {
    // Calculate actual length based on type
    let actualLength = length;
    let bytesPerElement = 1;
    
    switch (type) {
      case 'Int16Array':
      case 'Uint16Array':
        bytesPerElement = 2;
        actualLength = Math.floor(length / 2);
        break;
      case 'Int32Array':
      case 'Uint32Array':
      case 'Float32Array':
        bytesPerElement = 4;
        actualLength = Math.floor(length / 4);
        break;
      case 'Float64Array':
        bytesPerElement = 8;
        actualLength = Math.floor(length / 8);
        break;
    }
    
    // Create appropriate view
    let result;
    switch (type) {
      case 'Int8Array':
        result = new Int8Array(module.memory.buffer, pointer, length);
        break;
      case 'Uint8Array':
        result = new Uint8Array(module.memory.buffer, pointer, length);
        break;
      case 'Int16Array':
        result = new Int16Array(module.memory.buffer, pointer, actualLength);
        break;
      case 'Uint16Array':
        result = new Uint16Array(module.memory.buffer, pointer, actualLength);
        break;
      case 'Int32Array':
        result = new Int32Array(module.memory.buffer, pointer, actualLength);
        break;
      case 'Uint32Array':
        result = new Uint32Array(module.memory.buffer, pointer, actualLength);
        break;
      case 'Float32Array':
        result = new Float32Array(module.memory.buffer, pointer, actualLength);
        break;
      case 'Float64Array':
        result = new Float64Array(module.memory.buffer, pointer, actualLength);
        break;
      default:
        throw new WasmMemoryError(`Unsupported array type: ${type}`);
    }
    
    // Create a copy to return
    return new (result.constructor as any)(result);
  } catch (error) {
    if (error instanceof WasmMemoryError) {
      throw error;
    }
    throw new WasmMemoryError(`Failed to copy data from WebAssembly memory: ${error.message}`);
  }
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
