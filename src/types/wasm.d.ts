
/**
 * WebAssembly module type definitions
 * 
 * This file provides TypeScript type definitions for WebAssembly modules
 * used in the application.
 */

/**
 * Declaration for importing WebAssembly modules
 */
declare module '*.wasm' {
  /**
   * The WebAssembly module instance
   */
  const wasmModule: WebAssembly.Module;
  
  /**
   * Default export of the WebAssembly module
   */
  export default wasmModule;
}

/**
 * Interface for WebAssembly module exports
 * This can be extended for specific modules
 */
export interface WasmModuleExports {
  /** 
   * Generic index signature for any exported functions
   */
  [key: string]: WebAssembly.ExportValue;
}

/**
 * Interface for FFmpeg WebAssembly module
 */
export interface FFmpegWasmModule extends WasmModuleExports {
  /** Initialize the module */
  _initialize?: () => number;
  /** Run a command */
  _run_command?: (cmdPtr: number) => number;
  /** Allocate memory */
  _malloc?: (size: number) => number;
  /** Free memory */
  _free?: (ptr: number) => void;
}

/**
 * Interface for OpenCV WebAssembly module
 */
export interface OpenCVWasmModule extends WasmModuleExports {
  /** Initialize the module */
  _initialize?: () => number;
  /** Process an image */
  _process_image?: (imgPtr: number, width: number, height: number) => number;
  /** Allocate memory */
  _malloc?: (size: number) => number;
  /** Free memory */
  _free?: (ptr: number) => void;
}
