// src/services/VideoServiceOptimized.ts
import EventEmitter from 'events';
import { shouldUseChunkedProcessing } from '../utils/fileChunker';
import workerManager, { WorkerType } from '../utils/workerManager';
import { VideoWorkerMessageType } from '../workers/videoWorker';
import { v4 as uuidv4 } from 'uuid';

export enum VideoServiceEvents {
  ANALYSIS_START = 'analysis_start',
  PROGRESS = 'progress',
  CHUNK_PROGRESS = 'chunk_progress',
  ANALYSIS_COMPLETE = 'analysis_complete',
  ERROR = 'error'
}

export interface VideoAnalysis {
  duration: number;
  frameRate: number;
  resolution: { width: number; height: number };
  scenes: { startTime: number; endTime: number; keyFrameUrl: string }[];
  contentAnalysis: { time: number; content: string }[];
}

export interface VideoProcessingProgress {
  stage?: string;
  progress: number; // 0-1
  message: string;
}

export interface VideoChunkProgress {
  chunkIndex: number;
  chunksTotal: number;
  bytesProcessed: number;
  totalBytes: number;
  percentage: number;
  stage: string;
}

/**
 * Service for processing video files
 * Optimized version that uses Web Workers for CPU-intensive tasks
 * Implements the Singleton pattern
 */
export class VideoServiceOptimized extends EventEmitter {
  private static instance: VideoServiceOptimized;
  private processingCache: Map<string, VideoAnalysis> = new Map();
  private activeOperations: Map<string, { cancel: () => void }> = new Map();
  
  // Memory management
  private frameCache: Map<string, {
    data: string;
    lastAccessed: number;
    size: number;
  }> = new Map();
  private maxFrameCacheSize = 50 * 1024 * 1024; // 50MB
  private currentFrameCacheSize = 0;
  
  private constructor() {
    super();
    
    // Set up periodic cache cleanup
    setInterval(() => this.cleanupFrameCache(), 60000); // Clean up every minute
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): VideoServiceOptimized {
    if (!VideoServiceOptimized.instance) {
      VideoServiceOptimized.instance = new VideoServiceOptimized();
    }
    return VideoServiceOptimized.instance;
  }
  
  /**
   * Analyze a video file
   */
  public async analyzeVideo(videoFile: File): Promise<VideoAnalysis> {
    try {
      // Check if we have cached results for this file
      const cacheKey = `${videoFile.name}-${videoFile.size}-${videoFile.lastModified}`;
      if (this.processingCache.has(cacheKey)) {
        const cachedResult = this.processingCache.get(cacheKey)!;
        this.emitEvent(VideoServiceEvents.ANALYSIS_COMPLETE, cachedResult);
        return cachedResult;
      }
      
      this.emitEvent(VideoServiceEvents.ANALYSIS_START);
      
      // Determine if we should use chunked processing
      const useChunkedProcessing = shouldUseChunkedProcessing(videoFile);
      
      // Generate a unique operation ID
      const operationId = uuidv4();
      
      // Create a cancel function
      const cancel = () => {
        // TODO: Implement cancellation
      };
      
      // Store the operation
      this.activeOperations.set(operationId, { cancel });
      
      try {
        // Use the worker to perform the analysis
        const videoAnalysis = await workerManager.executeTask<VideoAnalysis>(
          WorkerType.VIDEO,
          VideoWorkerMessageType.ANALYZE_VIDEO,
          { videoFile, useChunkedProcessing },
          (progress) => {
            if ('stage' in progress) {
              // Regular progress update
              this.emitEvent(VideoServiceEvents.PROGRESS, progress);
            } else {
              // Chunk progress update
              this.emitEvent(VideoServiceEvents.CHUNK_PROGRESS, progress);
            }
          }
        );
        
        // Cache the results
        this.processingCache.set(cacheKey, videoAnalysis);
        
        this.emitEvent(VideoServiceEvents.ANALYSIS_COMPLETE, videoAnalysis);
        return videoAnalysis;
      } finally {
        // Clean up the operation
        this.activeOperations.delete(operationId);
      }
    } catch (error) {
      this.emitEvent(VideoServiceEvents.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Extract frames from a video file
   * @param videoFile Video file
   * @param frameRate Frame rate to extract (frames per second)
   * @param progressCallback Progress callback
   * @returns Promise resolving to an array of frames
   */
  public async extractFrames(
    videoFile: File,
    frameRate: number,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<any[]> {
    try {
      return await workerManager.executeTask(
        WorkerType.VIDEO,
        VideoWorkerMessageType.EXTRACT_FRAMES,
        { videoFile, frameRate },
        (progress) => {
          progressCallback?.(progress.progress, progress.message);
        }
      );
    } catch (error) {
      console.error('Error extracting frames:', error);
      throw error;
    }
  }
  
  /**
   * Detect scenes in a video
   * @param frames Video frames
   * @param progressCallback Progress callback
   * @returns Promise resolving to an array of scenes
   */
  public async detectScenes(
    frames: any[],
    progressCallback?: (progress: number, message: string) => void
  ): Promise<any[]> {
    try {
      return await workerManager.executeTask(
        WorkerType.VIDEO,
        VideoWorkerMessageType.DETECT_SCENES,
        { frames },
        (progress) => {
          progressCallback?.(progress.progress, progress.message);
        }
      );
    } catch (error) {
      console.error('Error detecting scenes:', error);
      throw error;
    }
  }
  
  /**
   * Analyze content in video frames
   * @param frames Video frames
   * @param progressCallback Progress callback
   * @returns Promise resolving to content analysis
   */
  public async analyzeContent(
    frames: any[],
    progressCallback?: (progress: number, message: string) => void
  ): Promise<any[]> {
    try {
      return await workerManager.executeTask(
        WorkerType.VIDEO,
        VideoWorkerMessageType.ANALYZE_CONTENT,
        { frames },
        (progress) => {
          progressCallback?.(progress.progress, progress.message);
        }
      );
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw error;
    }
  }
  
  /**
   * Analyze motion in video frames
   * @param frames Video frames
   * @param progressCallback Progress callback
   * @returns Promise resolving to motion analysis
   */
  public async analyzeMotion(
    frames: any[],
    progressCallback?: (progress: number, message: string) => void
  ): Promise<any> {
    try {
      return await workerManager.executeTask(
        WorkerType.VIDEO,
        VideoWorkerMessageType.ANALYZE_MOTION,
        { frames },
        (progress) => {
          progressCallback?.(progress.progress, progress.message);
        }
      );
    } catch (error) {
      console.error('Error analyzing motion:', error);
      throw error;
    }
  }
  
  /**
   * Cache a video frame
   * @param key Cache key
   * @param data Frame data (data URL)
   */
  public cacheFrame(key: string, data: string): void {
    // Estimate size of the data URL
    const size = data.length;
    
    // Make room in the cache if needed
    while (this.currentFrameCacheSize + size > this.maxFrameCacheSize && this.frameCache.size > 0) {
      this.evictOldestFromFrameCache();
    }
    
    // Add to cache
    this.frameCache.set(key, {
      data,
      lastAccessed: Date.now(),
      size
    });
    
    this.currentFrameCacheSize += size;
  }
  
  /**
   * Get a cached frame
   * @param key Cache key
   * @returns Frame data or null if not found
   */
  public getCachedFrame(key: string): string | null {
    const cached = this.frameCache.get(key);
    
    if (cached) {
      // Update last accessed time
      cached.lastAccessed = Date.now();
      return cached.data;
    }
    
    return null;
  }
  
  /**
   * Evict the oldest item from the frame cache
   */
  private evictOldestFromFrameCache(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, { lastAccessed }] of this.frameCache.entries()) {
      if (lastAccessed < oldestTime) {
        oldestTime = lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const { size } = this.frameCache.get(oldestKey)!;
      this.frameCache.delete(oldestKey);
      this.currentFrameCacheSize -= size;
    }
  }
  
  /**
   * Clean up the frame cache by removing old items
   */
  private cleanupFrameCache(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, { lastAccessed, size }] of this.frameCache.entries()) {
      if (now - lastAccessed > maxAge) {
        this.frameCache.delete(key);
        this.currentFrameCacheSize -= size;
      }
    }
  }
  
  /**
   * Emit an event with data
   */
  private emitEvent(event: VideoServiceEvents, data?: any): void {
    this.emit(event, data);
  }
  
  /**
   * Clear the processing cache
   */
  public clearCache(): void {
    this.processingCache.clear();
    this.frameCache.clear();
    this.currentFrameCacheSize = 0;
  }
  
  /**
   * Cancel all active operations
   */
  public cancelAll(): void {
    for (const { cancel } of this.activeOperations.values()) {
      cancel();
    }
    this.activeOperations.clear();
  }
}

// Export the singleton instance
export const videoServiceOptimized = VideoServiceOptimized.getInstance();

export default VideoServiceOptimized;
