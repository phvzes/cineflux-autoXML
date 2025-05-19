/**
 * Performance Optimizations
 * Entry point for all performance optimizations
 */

import { FFmpegLoader, OpenCVLoader } from '../utils/wasm/lazyWasmLoader';
import workerManager, { WorkerType } from '../utils/workerManager';
import memoryManager, { MemoryEventType } from '../utils/memoryManager';
import browserOptimizations from '../utils/browserOptimizations';
import serviceProvider from '../services/ServiceProvider';

/**
 * Initialize performance optimizations
 */
export async function initializeOptimizations(): Promise<void> {
  console.info('[Optimizations] Initializing performance optimizations...');
  
  // Initialize memory management
  if (serviceProvider.isMemoryManagementEnabled()) {
    console.info('[Optimizations] Initializing memory management...');
    
    // Set up memory cleanup listener
    memoryManager.addEventListener(MemoryEventType.CLEANUP_NEEDED, ({ status }) => {
      console.info(`[Optimizations] Memory cleanup needed (status: ${status})`);
      
      // Perform cleanup based on memory status
      if (status === 'critical') {
        // Force immediate cleanup
        console.info('[Optimizations] Performing critical memory cleanup...');
        
        // Clear caches
        const audioService = serviceProvider.getAudioService();
        if ('clearCache' in audioService) {
          (audioService as any).clearCache();
        }
        
        const videoService = serviceProvider.getVideoService();
        if ('clearCache' in videoService) {
          (videoService as any).clearCache();
        }
      }
    });
  }
  
  // Initialize browser-specific optimizations
  if (serviceProvider.areBrowserOptimizationsEnabled()) {
    console.info('[Optimizations] Initializing browser-specific optimizations...');
    
    const browser = browserOptimizations.detectBrowser();
    console.info(`[Optimizations] Detected browser: ${browser}`);
    
    // Apply Chrome-specific optimizations
    if (serviceProvider.shouldApplyChromeOptimizations()) {
      console.info('[Optimizations] Applying Chrome-specific optimizations...');
      
      // Chrome optimizations are applied when needed through the browserOptimizations utility
    }
  }
  
  // Preload WebAssembly modules if not using lazy loading
  if (!serviceProvider.isLazyLoadingEnabled()) {
    console.info('[Optimizations] Preloading WebAssembly modules...');
    
    try {
      // Preload FFmpeg
      await FFmpegLoader.preload((progress) => {
        console.info(`[Optimizations] FFmpeg preloading: ${progress.percentage}%`);
      });
      
      // Preload OpenCV
      await OpenCVLoader.preload((progress) => {
        console.info(`[Optimizations] OpenCV preloading: ${progress.percentage}%`);
      });
      
      console.info('[Optimizations] WebAssembly modules preloaded successfully');
    } catch (error) {
      console.error('[Optimizations] Error preloading WebAssembly modules:', error);
    }
  }
  
  console.info('[Optimizations] Performance optimizations initialized successfully');
}

/**
 * Clean up resources used by optimizations
 */
export function cleanupOptimizations(): void {
  console.info('[Optimizations] Cleaning up performance optimizations...');
  
  // Terminate worker threads
  if (serviceProvider.areWorkerThreadsEnabled()) {
    console.info('[Optimizations] Terminating worker threads...');
    workerManager.terminateAll();
  }
  
  // Clear caches
  const audioService = serviceProvider.getAudioService();
  if ('clearCache' in audioService) {
    (audioService as any).clearCache();
  }
  
  const videoService = serviceProvider.getVideoService();
  if ('clearCache' in videoService) {
    (videoService as any).clearCache();
  }
  
  console.info('[Optimizations] Performance optimizations cleaned up successfully');
}

/**
 * Get optimization status
 * @returns Optimization status object
 */
export function getOptimizationStatus(): {
  lazyLoading: boolean;
  workerThreads: boolean;
  memoryManagement: boolean;
  browserOptimizations: boolean;
  chromeOptimizations: boolean;
  wasmModulesPreloaded: boolean;
} {
  return {
    lazyLoading: serviceProvider.isLazyLoadingEnabled(),
    workerThreads: serviceProvider.areWorkerThreadsEnabled(),
    memoryManagement: serviceProvider.isMemoryManagementEnabled(),
    browserOptimizations: serviceProvider.areBrowserOptimizationsEnabled(),
    chromeOptimizations: serviceProvider.shouldApplyChromeOptimizations(),
    wasmModulesPreloaded: FFmpegLoader.isLoaded() && OpenCVLoader.isLoaded()
  };
}

// Export default object
export default {
  initializeOptimizations,
  cleanupOptimizations,
  getOptimizationStatus
};
