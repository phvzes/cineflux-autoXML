
/**
 * wasmFallback.ts
 * 
 * Utility for providing fallback mechanisms when WebAssembly is not supported.
 * Implements JavaScript-based alternatives for critical WebAssembly functionality.
 */

import { supportsWebAssembly } from './compat';

// Interface for fallback implementations
interface FallbackImplementation {
  name: string;
  description: string;
  performance: 'low' | 'medium' | 'high';
  isAvailable: () => boolean;
  getImplementation: () => any;
}

// Registry of fallback implementations
const fallbackRegistry: Record<string, FallbackImplementation[]> = {
  'ffmpeg': [],
  'opencv': [],
  'audio-processing': [],
};

/**
 * Register a fallback implementation for a specific module
 * 
 * @param moduleName - Name of the module (e.g., 'ffmpeg', 'opencv')
 * @param implementation - Fallback implementation details
 */
export function registerFallback(
  moduleName: string,
  implementation: FallbackImplementation
): void {
  if (!fallbackRegistry[moduleName]) {
    fallbackRegistry[moduleName] = [];
  }
  
  fallbackRegistry[moduleName].push(implementation);
  
  // Sort implementations by performance (high to low)
  fallbackRegistry[moduleName].sort((a, b) => {
    const performanceScore = {
      'high': 3,
      'medium': 2,
      'low': 1,
    };
    
    return performanceScore[b.performance] - performanceScore[a.performance];
  });
}

/**
 * Get the best available fallback implementation for a module
 * 
 * @param moduleName - Name of the module
 * @returns The best available fallback implementation, or null if none available
 */
export function getBestFallback(moduleName: string): any {
  // If WebAssembly is supported, no fallback is needed
  if (supportsWebAssembly()) {
    return null;
  }
  
  // Get registered fallbacks for this module
  const fallbacks = fallbackRegistry[moduleName] || [];
  
  // Find the first available fallback
  for (const fallback of fallbacks) {
    if (fallback.isAvailable()) {
      if (import.meta.env.DEV) {
        console.log(`[WasmFallback] Using fallback for ${moduleName}: ${fallback.name} (${fallback.performance} performance)`);
      }
      
      return fallback.getImplementation();
    }
  }
  
  // No fallback available
  return null;
}

/**
 * Check if any fallback is available for a module
 * 
 * @param moduleName - Name of the module
 * @returns Boolean indicating if a fallback is available
 */
export function hasFallback(moduleName: string): boolean {
  // If WebAssembly is supported, no fallback is needed
  if (supportsWebAssembly()) {
    return true;
  }
  
  // Get registered fallbacks for this module
  const fallbacks = fallbackRegistry[moduleName] || [];
  
  // Check if any fallback is available
  return fallbacks.some(fallback => fallback.isAvailable());
}

/**
 * Get all available fallbacks for a module
 * 
 * @param moduleName - Name of the module
 * @returns Array of available fallback implementations
 */
export function getAvailableFallbacks(moduleName: string): FallbackImplementation[] {
  // If WebAssembly is supported, no fallback is needed
  if (supportsWebAssembly()) {
    return [];
  }
  
  // Get registered fallbacks for this module
  const fallbacks = fallbackRegistry[moduleName] || [];
  
  // Filter to only available fallbacks
  return fallbacks.filter(fallback => fallback.isAvailable());
}

// Register basic JavaScript fallbacks for audio processing
registerFallback('audio-processing', {
  name: 'JavaScript Audio Processing',
  description: 'Basic audio processing implemented in JavaScript',
  performance: 'low',
  isAvailable: () => typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
  getImplementation: () => {
    // Simple JavaScript implementation of audio beat detection
    return {
      detectBeats: async (audioBuffer: AudioBuffer): Promise<number[]> => {
        const threshold = 0.15;
        const data = audioBuffer.getChannelData(0);
        const beats: number[] = [];
        
        // Simple energy-based beat detection
        const windowSize = Math.floor(audioBuffer.sampleRate / 10); // 100ms window
        
        for (let i = 0; i < data.length - windowSize; i += windowSize / 2) {
          let sum = 0;
          
          // Calculate energy in this window
          for (let j = 0; j < windowSize; j++) {
            sum += Math.abs(data[i + j]);
          }
          
          const average = sum / windowSize;
          
          // Check if this window has higher energy than threshold
          if (average > threshold) {
            const timeInSeconds = i / audioBuffer.sampleRate;
            beats.push(timeInSeconds);
            
            // Skip forward to avoid detecting the same beat multiple times
            i += windowSize;
          }
        }
        
        return beats;
      },
      
      // Other audio processing methods would go here
    };
  },
});

export default {
  registerFallback,
  getBestFallback,
  hasFallback,
  getAvailableFallbacks,
};
