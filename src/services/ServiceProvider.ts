/**
 * Service Provider
 * Provides access to optimized services
 */

import AudioService from './AudioService';
import VideoService from './VideoService';
import AudioServiceOptimized from './AudioServiceOptimized';
import VideoServiceOptimized from './VideoServiceOptimized';
import { isChrome } from '../utils/browserOptimizations';
import memoryManager, { startMemoryMonitoring } from '../utils/memoryManager';

// Feature flags for optimizations
const USE_OPTIMIZED_SERVICES = true;
const USE_LAZY_LOADING = true;
const USE_WORKER_THREADS = true;
const USE_MEMORY_MANAGEMENT = true;
const USE_BROWSER_OPTIMIZATIONS = true;

/**
 * Service Provider class
 * Singleton pattern for providing services
 */
class ServiceProvider {
  private static instance: ServiceProvider;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize memory monitoring
    if (USE_MEMORY_MANAGEMENT) {
      startMemoryMonitoring(5000); // Check memory every 5 seconds
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ServiceProvider {
    if (!ServiceProvider.instance) {
      ServiceProvider.instance = new ServiceProvider();
    }
    return ServiceProvider.instance;
  }
  
  /**
   * Get the audio service
   * @returns Audio service instance
   */
  public getAudioService(): AudioService | AudioServiceOptimized {
    if (USE_OPTIMIZED_SERVICES && USE_WORKER_THREADS) {
      return AudioServiceOptimized.getInstance();
    } else {
      return AudioService.getInstance();
    }
  }
  
  /**
   * Get the video service
   * @returns Video service instance
   */
  public getVideoService(): VideoService | VideoServiceOptimized {
    if (USE_OPTIMIZED_SERVICES && USE_WORKER_THREADS) {
      return VideoServiceOptimized.getInstance();
    } else {
      return VideoService.getInstance();
    }
  }
  
  /**
   * Check if lazy loading is enabled
   * @returns True if lazy loading is enabled
   */
  public isLazyLoadingEnabled(): boolean {
    return USE_LAZY_LOADING;
  }
  
  /**
   * Check if worker threads are enabled
   * @returns True if worker threads are enabled
   */
  public areWorkerThreadsEnabled(): boolean {
    return USE_WORKER_THREADS;
  }
  
  /**
   * Check if memory management is enabled
   * @returns True if memory management is enabled
   */
  public isMemoryManagementEnabled(): boolean {
    return USE_MEMORY_MANAGEMENT;
  }
  
  /**
   * Check if browser optimizations are enabled
   * @returns True if browser optimizations are enabled
   */
  public areBrowserOptimizationsEnabled(): boolean {
    return USE_BROWSER_OPTIMIZATIONS;
  }
  
  /**
   * Check if Chrome optimizations should be applied
   * @returns True if Chrome optimizations should be applied
   */
  public shouldApplyChromeOptimizations(): boolean {
    return USE_BROWSER_OPTIMIZATIONS && isChrome();
  }
  
  /**
   * Get the memory manager
   * @returns Memory manager instance
   */
  public getMemoryManager(): typeof memoryManager {
    return memoryManager;
  }
}

// Export the singleton instance
export default ServiceProvider.getInstance();
