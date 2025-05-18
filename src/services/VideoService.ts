
import EventEmitter from 'events';
import { processFileInChunks, shouldUseChunkedProcessing, ChunkProgress } from '../utils/fileChunker';
import { 
  VideoProcessingOptions, 
  FrameExtractionOptions, 
  VideoProcessingProgressCallback,
  VideoProcessingWasmModule
} from '../types/media-processing';
import { VideoFile } from '../types/VideoFile';

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

export interface VideoChunkProgress extends ChunkProgress {
  stage: string;
}

// VideoFile interface is now imported from '../types/VideoFile'

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Service for processing video files
 * Implements the Singleton pattern
 */
export class VideoService extends EventEmitter {
  private static instance: VideoService;
  private processingCache: Map<string, VideoAnalysis> = new Map();
  
  private constructor() {
    super();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }
  
  /**
   * Load a video file and return basic metadata
   * @param file The video file to load
   * @returns Promise resolving to a VideoFile object with metadata
   */
  public async loadVideoFile(file: File): Promise<VideoFile> {
    return new Promise((resolve, reject) => {
      try {
        // Create a URL for the file
        const url = URL.createObjectURL(file);
        
        // Create a video element to extract metadata
        const video = document.createElement('video');
        
        // Set up event handlers
        video.onloadedmetadata = () => {
          // Extract metadata
          const videoFile: VideoFile = {
            id: `video-${Date.now()}`,
            name: file.name,
            type: file.type,
            size: file.size,
            duration: video.duration,
            resolution: {
              width: video.videoWidth,
              height: video.videoHeight
            },
            frameRate: 30, // Default, as we can't easily get this from the video element
            url
          };
          
          // Clean up
          URL.revokeObjectURL(url);
          
          resolve(videoFile);
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to load video file: ${file.name}`));
        };
        
        // Start loading the video
        video.src = url;
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Analyze a video file
   * @param videoFile The video file to analyze
   * @param options Optional parameters for analysis
   * @returns Promise resolving to video analysis data
   */
  public async analyzeVideo(videoFile: File, options?: VideoProcessingOptions): Promise<VideoAnalysis> {
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
      
      let videoAnalysis: VideoAnalysis;
      
      if (useChunkedProcessing) {
        videoAnalysis = await this.processLargeVideo(videoFile);
      } else {
        videoAnalysis = await this.processStandardVideo(videoFile);
      }
      
      // Cache the results
      this.processingCache.set(cacheKey, videoAnalysis);
      
      this.emitEvent(VideoServiceEvents.ANALYSIS_COMPLETE, videoAnalysis);
      return videoAnalysis;
    } catch (error) {
      this.emitEvent(VideoServiceEvents.ERROR, error);
      throw error;
    }
  }
  
  /**
   * Extract frames from a video file at specified intervals
   * @param file The video file to extract frames from
   * @param options Optional parameters for frame extraction
   * @returns Promise resolving to an array of frame data
   */
  public async extractFrames(file: File, options?: FrameExtractionOptions): Promise<{ time: number; dataUrl: string }[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Default options
        const interval = options?.interval || 1; // 1 second interval
        const maxFrames = options?.maxFrames || 100;
        const quality = options?.quality || 0.8;
        
        // Create a URL for the file
        const url = URL.createObjectURL(file);
        
        // Create video element
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        // Set up event handlers
        video.onloadedmetadata = async () => {
          try {
            // Calculate how many frames to extract
            const duration = video.duration;
            const frameCount = Math.min(
              maxFrames,
              Math.floor(duration / interval)
            );
            
            // Create a canvas for frame extraction
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Failed to create canvas context');
            }
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Array to store frames
            const frames: { time: number; dataUrl: string }[] = [];
            
            // Extract frames
            for (let i = 0; i < frameCount; i++) {
              const time = i * interval;
              
              // Seek to the time
              video.currentTime = time;
              
              // Wait for the seek to complete
              await new Promise<void>(seekResolve => {
                const seekHandler = () => {
                  video.removeEventListener('seeked', seekHandler);
                  seekResolve();
                };
                video.addEventListener('seeked', seekHandler);
              });
              
              // Draw the frame to the canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Convert to data URL
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              
              // Add to frames array
              frames.push({ time, dataUrl });
            }
            
            // Clean up
            URL.revokeObjectURL(url);
            
            resolve(frames);
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to load video file: ${file.name}`));
        };
        
        // Start loading the video
        video.src = url;
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Generate a thumbnail from a video file at a specific time
   * @param file The video file to generate a thumbnail from
   * @param time The time in seconds to capture the thumbnail
   * @param options Optional parameters for thumbnail generation
   * @returns Promise resolving to a data URL of the thumbnail
   */
  public async generateThumbnail(
    file: File, 
    time: number, 
    options?: ThumbnailOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create a URL for the file
        const url = URL.createObjectURL(file);
        
        // Create video element
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        // Set up event handlers
        video.onloadedmetadata = () => {
          // Ensure the time is within the video duration
          const seekTime = Math.min(time, video.duration - 0.1);
          
          // Seek to the specified time
          video.currentTime = seekTime;
        };
        
        video.onseeked = () => {
          try {
            // Create a canvas for the thumbnail
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Failed to create canvas context');
            }
            
            // Set canvas dimensions
            const width = options?.width || video.videoWidth;
            const height = options?.height || video.videoHeight;
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw the frame to the canvas
            ctx.drawImage(video, 0, 0, width, height);
            
            // Convert to data URL
            const quality = options?.quality || 0.8;
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            resolve(dataUrl);
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to load video file: ${file.name}`));
        };
        
        // Start loading the video
        video.src = url;
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Process a standard-sized video file
   */
  private async processStandardVideo(videoFile: File): Promise<VideoAnalysis> {
    // Simulate video processing with progress updates
    this.emitEvent(VideoServiceEvents.PROGRESS, { 
      message: 'Loading video file...',
      progress: 0.1,
      stage: 'loading'
    });
    
    // Simulate frame extraction
    await this.simulateProcessingDelay(1000);
    this.emitEvent(VideoServiceEvents.PROGRESS, { 
      message: 'Extracting frames...',
      progress: 0.3,
      stage: 'frames'
    });
    
    // Simulate scene detection
    await this.simulateProcessingDelay(1500);
    this.emitEvent(VideoServiceEvents.PROGRESS, { 
      message: 'Detecting scenes...',
      progress: 0.6,
      stage: 'scenes'
    });
    
    // Simulate content analysis
    await this.simulateProcessingDelay(1200);
    this.emitEvent(VideoServiceEvents.PROGRESS, { 
      message: 'Analyzing content...',
      progress: 0.8,
      stage: 'content'
    });
    
    // Simulate motion analysis
    await this.simulateProcessingDelay(800);
    this.emitEvent(VideoServiceEvents.PROGRESS, { 
      message: 'Analyzing motion...',
      progress: 0.9,
      stage: 'motion'
    });
    
    // Complete the analysis
    await this.simulateProcessingDelay(500);
    this.emitEvent(VideoServiceEvents.PROGRESS, { 
      message: 'Finalizing analysis...',
      progress: 1.0,
      stage: 'complete'
    });
    
    // Return mock analysis results
    return this.createMockVideoAnalysis(videoFile);
  }
  
  /**
   * Process a large video file in chunks
   */
  private async processLargeVideo(videoFile: File): Promise<VideoAnalysis> {
    // Initial progress update
    this.emitEvent(VideoServiceEvents.PROGRESS, { 
      message: 'Preparing to process large video file...',
      progress: 0.05,
      stage: 'loading'
    });
    
    // Process the file in chunks
    await processFileInChunks(
      videoFile,
      async (chunk, chunkIndex, chunksTotal) => {
        // Determine which processing stage we're in based on chunk index
        let stage = 'loading';
        let baseProgress = 0;
        
        if (chunkIndex < chunksTotal * 0.2) {
          stage = 'loading';
          baseProgress = 0;
        } else if (chunkIndex < chunksTotal * 0.4) {
          stage = 'frames';
          baseProgress = 0.2;
        } else if (chunkIndex < chunksTotal * 0.7) {
          stage = 'scenes';
          baseProgress = 0.4;
        } else if (chunkIndex < chunksTotal * 0.9) {
          stage = 'content';
          baseProgress = 0.7;
        } else {
          stage = 'motion';
          baseProgress = 0.9;
        }
        
        // Simulate processing this chunk
        await this.simulateProcessingDelay(300);
        
        // Return mock chunk result (in a real implementation, this would process the chunk)
        return { chunkIndex, processed: true };
      },
      (progress) => {
        // Determine which processing stage we're in based on progress
        let stage = 'loading';
        let message = 'Loading video file...';
        let baseProgress = 0;
        
        if (progress.percentage < 20) {
          stage = 'loading';
          message = 'Loading video file...';
          baseProgress = 0;
        } else if (progress.percentage < 40) {
          stage = 'frames';
          message = 'Extracting frames...';
          baseProgress = 0.2;
        } else if (progress.percentage < 70) {
          stage = 'scenes';
          message = 'Detecting scenes...';
          baseProgress = 0.4;
        } else if (progress.percentage < 90) {
          stage = 'content';
          message = 'Analyzing content...';
          baseProgress = 0.7;
        } else {
          stage = 'motion';
          message = 'Analyzing motion...';
          baseProgress = 0.9;
        }
        
        // Calculate overall progress (combine base progress with chunk progress)
        const stageWeight = stage === 'loading' ? 0.2 : 
                           stage === 'frames' ? 0.2 : 
                           stage === 'scenes' ? 0.3 : 
                           stage === 'content' ? 0.2 : 0.1;
        
        const stageProgress = (progress.percentage / 100) * stageWeight;
        const overallProgress = baseProgress + stageProgress;
        
        // Emit both chunk progress and overall progress events
        this.emitEvent(VideoServiceEvents.CHUNK_PROGRESS, {
          ...progress,
          stage
        });
        
        this.emitEvent(VideoServiceEvents.PROGRESS, {
          message,
          progress: overallProgress,
          stage
        });
      }
    );
    
    // Final progress update
    this.emitEvent(VideoServiceEvents.PROGRESS, { 
      message: 'Finalizing analysis...',
      progress: 1.0,
      stage: 'complete'
    });
    
    // Return mock analysis results
    return this.createMockVideoAnalysis(videoFile);
  }
  
  /**
   * Create mock video analysis results
   */
  private createMockVideoAnalysis(videoFile: File): VideoAnalysis {
    return {
      duration: 120, // 2 minutes
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
      scenes: [
        { startTime: 0, endTime: 15, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
        { startTime: 15, endTime: 45, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
        { startTime: 45, endTime: 75, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
        { startTime: 75, endTime: 105, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
        { startTime: 105, endTime: 120, keyFrameUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }
      ],
      contentAnalysis: [
        { time: 10, content: 'Opening scene' },
        { time: 30, content: 'Character introduction' },
        { time: 60, content: 'Main action sequence' },
        { time: 90, content: 'Resolution' },
        { time: 115, content: 'Closing scene' }
      ]
    };
  }
  
  /**
   * Simulate a processing delay
   */
  private simulateProcessingDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
  }
}

// Export the singleton instance
export const videoService = VideoService.getInstance();
