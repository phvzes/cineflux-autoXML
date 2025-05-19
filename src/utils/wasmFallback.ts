
import { isWebAssemblySupported } from './compat';

/**
 * Fallback options for when WebAssembly is not supported
 */
export enum WasmFallbackStrategy {
  ERROR = 'error',
  REMOTE_PROCESSING = 'remote_processing',
  SIMPLIFIED_PROCESSING = 'simplified_processing',
  DISABLE_FEATURE = 'disable_feature'
}

/**
 * Configuration for WebAssembly fallback
 */
export interface WasmFallbackConfig {
  strategy: WasmFallbackStrategy;
  remoteEndpoint?: string;
  featureDisableMessage?: string;
  errorMessage?: string;
}

/**
 * Default fallback configuration
 */
const defaultFallbackConfig: WasmFallbackConfig = {
  strategy: WasmFallbackStrategy.ERROR,
  errorMessage: 'WebAssembly is required for this feature but is not supported in your browser.'
};

/**
 * Execute a function with WebAssembly fallback
 * @param wasmFn Function that uses WebAssembly
 * @param fallbackConfig Fallback configuration
 * @returns Result of the function or fallback
 */
export async function executeWithFallback<T>(
  wasmFn: () => Promise<T>,
  fallbackConfig: Partial<WasmFallbackConfig> = {}
): Promise<T> {
  const config = { ...defaultFallbackConfig, ...fallbackConfig };
  
  if (isWebAssemblySupported()) {
    return wasmFn();
  }
  
  // Handle fallback based on strategy
  switch (config.strategy) {
    case WasmFallbackStrategy.REMOTE_PROCESSING:
      if (!config.remoteEndpoint) {
        throw new Error('Remote endpoint is required for remote processing fallback');
      }
      // Implementation for remote processing would go here
      throw new Error('Remote processing fallback not implemented');
      
    case WasmFallbackStrategy.SIMPLIFIED_PROCESSING:
      // Implementation for simplified processing would go here
      throw new Error('Simplified processing fallback not implemented');
      
    case WasmFallbackStrategy.DISABLE_FEATURE:
      throw new Error(config.featureDisableMessage || 'This feature is disabled because WebAssembly is not supported in your browser.');
      
    case WasmFallbackStrategy.ERROR:
    default:
      throw new Error(config.errorMessage || defaultFallbackConfig.errorMessage);
  }
}

export default {
  WasmFallbackStrategy,
  executeWithFallback
};
