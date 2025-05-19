/**
 * Memory Manager
 * Utilities for managing memory usage in the application
 */

// Memory usage thresholds
const HIGH_MEMORY_THRESHOLD = 0.8; // 80% of available memory
const CRITICAL_MEMORY_THRESHOLD = 0.9; // 90% of available memory

// Memory usage status
export enum MemoryStatus {
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Memory usage event types
export enum MemoryEventType {
  STATUS_CHANGE = 'status_change',
  CLEANUP_NEEDED = 'cleanup_needed'
}

// Memory event listeners
const eventListeners: Map<MemoryEventType, Function[]> = new Map();

// Disposable resources
interface DisposableResource {
  id: string;
  priority: number; // Higher number = higher priority to keep (less likely to be disposed)
  size: number; // Size in bytes
  dispose: () => void;
}

// Resource registry
const resources: Map<string, DisposableResource> = new Map();

// Last memory status
let lastMemoryStatus: MemoryStatus = MemoryStatus.NORMAL;

// Check if performance.memory is available
const hasMemoryInfo = typeof performance !== 'undefined' && 
                     'memory' in performance && 
                     typeof (performance as any).memory?.usedJSHeapSize === 'number';

/**
 * Get current memory usage
 * @returns Memory usage information
 */
export function getMemoryUsage(): { used: number; total: number; ratio: number } {
  if (!hasMemoryInfo) {
    // If memory info is not available, return default values
    return { used: 0, total: 100, ratio: 0 };
  }
  
  const memory = (performance as any).memory;
  const used = memory.usedJSHeapSize;
  const total = memory.jsHeapSizeLimit;
  const ratio = used / total;
  
  return { used, total, ratio };
}

/**
 * Get current memory status
 * @returns Memory status
 */
export function getMemoryStatus(): MemoryStatus {
  const { ratio } = getMemoryUsage();
  
  if (ratio >= CRITICAL_MEMORY_THRESHOLD) {
    return MemoryStatus.CRITICAL;
  } else if (ratio >= HIGH_MEMORY_THRESHOLD) {
    return MemoryStatus.HIGH;
  } else {
    return MemoryStatus.NORMAL;
  }
}

/**
 * Register a disposable resource
 * @param resource Disposable resource
 * @returns Resource ID
 */
export function registerResource(resource: Omit<DisposableResource, 'id'>): string {
  const id = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  resources.set(id, { ...resource, id });
  return id;
}

/**
 * Unregister a disposable resource
 * @param id Resource ID
 */
export function unregisterResource(id: string): void {
  resources.delete(id);
}

/**
 * Dispose a resource
 * @param id Resource ID
 */
export function disposeResource(id: string): void {
  const resource = resources.get(id);
  if (resource) {
    resource.dispose();
    resources.delete(id);
  }
}

/**
 * Free memory by disposing resources
 * @param bytesToFree Number of bytes to free
 * @returns Number of bytes freed
 */
export function freeMemory(bytesToFree: number): number {
  // Sort resources by priority (ascending)
  const sortedResources = Array.from(resources.values())
    .sort((a, b) => a.priority - b.priority);
  
  let bytesFreed = 0;
  
  for (const resource of sortedResources) {
    if (bytesFreed >= bytesToFree) {
      break;
    }
    
    resource.dispose();
    resources.delete(resource.id);
    bytesFreed += resource.size;
  }
  
  return bytesFreed;
}

/**
 * Check memory status and trigger events if needed
 */
export function checkMemory(): void {
  const status = getMemoryStatus();
  
  // If status changed, trigger status change event
  if (status !== lastMemoryStatus) {
    triggerEvent(MemoryEventType.STATUS_CHANGE, { status, previous: lastMemoryStatus });
    lastMemoryStatus = status;
  }
  
  // If memory usage is high or critical, trigger cleanup event
  if (status === MemoryStatus.HIGH || status === MemoryStatus.CRITICAL) {
    triggerEvent(MemoryEventType.CLEANUP_NEEDED, { status });
    
    // If critical, force cleanup
    if (status === MemoryStatus.CRITICAL) {
      const { used, total } = getMemoryUsage();
      const bytesToFree = used - (total * HIGH_MEMORY_THRESHOLD);
      freeMemory(bytesToFree);
    }
  }
}

/**
 * Add event listener
 * @param event Event type
 * @param callback Callback function
 */
export function addEventListener(event: MemoryEventType, callback: Function): void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  
  eventListeners.get(event)!.push(callback);
}

/**
 * Remove event listener
 * @param event Event type
 * @param callback Callback function
 */
export function removeEventListener(event: MemoryEventType, callback: Function): void {
  if (!eventListeners.has(event)) {
    return;
  }
  
  const listeners = eventListeners.get(event)!;
  const index = listeners.indexOf(callback);
  
  if (index >= 0) {
    listeners.splice(index, 1);
  }
}

/**
 * Trigger an event
 * @param event Event type
 * @param data Event data
 */
function triggerEvent(event: MemoryEventType, data: any): void {
  if (!eventListeners.has(event)) {
    return;
  }
  
  for (const callback of eventListeners.get(event)!) {
    try {
      callback(data);
    } catch (error) {
      console.error(`Error in memory event listener for ${event}:`, error);
    }
  }
}

/**
 * Start memory monitoring
 * @param interval Check interval in milliseconds
 */
export function startMemoryMonitoring(interval: number = 10000): void {
  setInterval(checkMemory, interval);
}

/**
 * Clean up video frame data
 * @param frameData Array of frame data objects
 * @param keepKeyFrames Whether to keep key frames
 * @returns Number of bytes freed
 */
export function cleanupVideoFrames(frameData: any[], keepKeyFrames: boolean = true): number {
  let bytesFreed = 0;
  
  for (let i = 0; i < frameData.length; i++) {
    const frame = frameData[i];
    
    // Skip key frames if keepKeyFrames is true
    if (keepKeyFrames && frame.isKeyFrame) {
      continue;
    }
    
    // If frame has a dataUrl, estimate its size and free it
    if (frame.dataUrl) {
      const size = frame.dataUrl.length;
      frame.dataUrl = null;
      bytesFreed += size;
    }
  }
  
  return bytesFreed;
}

/**
 * Create a memory-efficient video frame processor
 * @param processFrame Function to process a single frame
 * @param maxConcurrent Maximum number of frames to process concurrently
 * @returns Function to process an array of frames
 */
export function createFrameProcessor<T, R>(
  processFrame: (frame: T) => Promise<R>,
  maxConcurrent: number = 4
): (frames: T[], onProgress?: (progress: number) => void) => Promise<R[]> {
  return async (frames: T[], onProgress?: (progress: number) => void): Promise<R[]> => {
    const results: R[] = new Array(frames.length);
    let completed = 0;
    
    // Process frames in batches
    for (let i = 0; i < frames.length; i += maxConcurrent) {
      // Check memory status before processing batch
      const status = getMemoryStatus();
      
      // If memory usage is critical, wait for garbage collection
      if (status === MemoryStatus.CRITICAL) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Process a batch of frames
      const batch = frames.slice(i, i + maxConcurrent);
      const batchPromises = batch.map((frame, j) => 
        processFrame(frame).then(result => {
          results[i + j] = result;
          completed++;
          onProgress?.(completed / frames.length);
        })
      );
      
      // Wait for batch to complete
      await Promise.all(batchPromises);
      
      // Force garbage collection if supported
      if (typeof global !== 'undefined' && 'gc' in global) {
        (global as any).gc();
      }
    }
    
    return results;
  };
}

// Export default object
export default {
  getMemoryUsage,
  getMemoryStatus,
  registerResource,
  unregisterResource,
  disposeResource,
  freeMemory,
  checkMemory,
  addEventListener,
  removeEventListener,
  startMemoryMonitoring,
  cleanupVideoFrames,
  createFrameProcessor
};
