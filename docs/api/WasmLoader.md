# WASM Loader Utility API Documentation

## Overview
The WASM Loader Utility provides functionality for loading, initializing, and managing WebAssembly modules within the CineFlux-AutoXML system. It handles module instantiation, memory management, and function exports to enable high-performance processing capabilities.

## Methods

### loadWasmModule(path, importObject)
Loads a WebAssembly module from the specified path with optional import objects.

**Parameters:**
- `path` (string): Path to the WebAssembly (.wasm) file
- `importObject` (Object, optional): Object containing values to be imported into the WebAssembly module

**Returns:**
- Promise<WasmModuleInstance>: The instantiated WebAssembly module

### initializeModule(module, options)
Initializes a loaded WebAssembly module with the provided options.

**Parameters:**
- `module` (WasmModuleInstance): The WebAssembly module instance
- `options` (InitOptions): Initialization options
  - `memory` (MemoryOptions, optional): Memory configuration
  - `debug` (boolean, optional): Enable debug mode

**Returns:**
- Promise<boolean>: Resolves to true when initialization is complete

### callWasmFunction(module, functionName, ...args)
Calls a function in the WebAssembly module with the provided arguments.

**Parameters:**
- `module` (WasmModuleInstance): The WebAssembly module instance
- `functionName` (string): Name of the function to call
- `...args` (any[]): Arguments to pass to the function

**Returns:**
- Promise<any>: Result of the function call

### allocateMemory(module, size)
Allocates memory in the WebAssembly module's heap.

**Parameters:**
- `module` (WasmModuleInstance): The WebAssembly module instance
- `size` (number): Size of memory to allocate in bytes

**Returns:**
- number: Pointer to the allocated memory

### freeMemory(module, pointer)
Frees previously allocated memory in the WebAssembly module's heap.

**Parameters:**
- `module` (WasmModuleInstance): The WebAssembly module instance
- `pointer` (number): Pointer to the memory to free

**Returns:**
- boolean: True if memory was successfully freed

### copyToWasmMemory(module, data, pointer)
Copies data from JavaScript to the WebAssembly module's memory.

**Parameters:**
- `module` (WasmModuleInstance): The WebAssembly module instance
- `data` (TypedArray): Data to copy
- `pointer` (number, optional): Pointer to copy to, or null to allocate new memory

**Returns:**
- number: Pointer to the memory where data was copied

### copyFromWasmMemory(module, pointer, length, type)
Copies data from the WebAssembly module's memory to JavaScript.

**Parameters:**
- `module` (WasmModuleInstance): The WebAssembly module instance
- `pointer` (number): Pointer to the memory to copy from
- `length` (number): Length of data to copy in bytes
- `type` (string): Type of array to create ('Int8Array', 'Uint8Array', etc.)

**Returns:**
- TypedArray: The copied data

## Usage Example

```typescript
import { loadWasmModule, callWasmFunction, copyToWasmMemory, copyFromWasmMemory } from '../utils/wasmLoader';

async function processImageWithWasm(imageData) {
  // Load the WebAssembly module
  const wasmModule = await loadWasmModule('/path/to/image-processing.wasm');
  
  // Initialize the module
  await initializeModule(wasmModule, {
    memory: { initial: 10, maximum: 100 },
    debug: true
  });
  
  // Copy image data to WebAssembly memory
  const inputPointer = copyToWasmMemory(wasmModule, imageData);
  
  // Allocate memory for the result
  const outputPointer = allocateMemory(wasmModule, imageData.length);
  
  // Call the image processing function
  await callWasmFunction(
    wasmModule,
    'processImage',
    inputPointer,
    outputPointer,
    imageData.width,
    imageData.height
  );
  
  // Copy the processed image data back to JavaScript
  const processedData = copyFromWasmMemory(
    wasmModule,
    outputPointer,
    imageData.length,
    'Uint8Array'
  );
  
  // Free allocated memory
  freeMemory(wasmModule, inputPointer);
  freeMemory(wasmModule, outputPointer);
  
  return processedData;
}
```

## Error Handling

The WASM Loader provides several error types for handling WebAssembly-related issues:

- `WasmLoadError`: Thrown when a module fails to load
- `WasmInitError`: Thrown when a module fails to initialize
- `WasmMemoryError`: Thrown when memory operations fail
- `WasmFunctionError`: Thrown when a function call fails

## Browser Compatibility

The WASM Loader utility is compatible with all modern browsers that support WebAssembly, including:

- Chrome 57+
- Firefox 53+
- Safari 11+
- Edge 16+

For older browsers, a fallback to JavaScript implementations can be configured.
