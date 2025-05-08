// src/services/VideoService.ts
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { Scene, Frame, VideoAnalysisResult, SceneType } from '../types/VideoAnalysis';

/**
 * Configuration options for video processing
 */
export interface VideoProcessingOptions {
  /** Frames per second to extract (default: 1) */
  framesPerSecond?: number;
  /** Scene detection threshold (0-1, default: 0.4) */
  sceneThreshold?: number;
  /** Maximum number of frames to extract (default: 300) */
  maxFrames?: number;
  /** Thumbnail width (default: 320) */
  thumbnailWidth?: number;
  /** Thumbnail height (default: 180) */
  thumbnailHeight?: number;
  /** Callback for progress updates */
  onProgress?: (progress: number, step: string) => void;
}

/**
 * Result of video processing
 */
export interface VideoProcessingResult {
  /** Extracted frames */
  frames: Frame[];
  /** Detected scenes */
  scenes: Scene[];
  /** Generated thumbnails (base64 encoded) */
  thumbnails: { timestamp: number, dataUrl: string }[];
  /** Video metadata */
  metadata: {
    duration: number;
    width: number;
    height: number;
    frameRate: number;
    filename: string;
  };
}

/**
 * Service for video analysis and processing
 */
class VideoService {
  private ffmpeg: any = null;
  private loaded = false;
  private baseUrl = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

  /**
   * Load FFmpeg WASM if not already loaded
   * @private
   */
  private async loadFFmpeg(): Promise<void> {
    if (this.loaded) return;

    try {
      this.ffmpeg = createFFmpeg({
        log: false,
        corePath: await toBlobURL(`${this.baseUrl}/ffmpeg-core.js`, 'text/javascript'),
        wasmPath: await toBlobURL(`${this.baseUrl}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      await this.ffmpeg.load();
      this.loaded = true;
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to load video processing library');
    }
  }

  /**
   * Process a video file to extract frames, detect scenes, and generate thumbnails
   * @param videoFile The video file to process
   * @param options Processing options
   * @returns Promise resolving to the processing results
   */
  async processVideo(
    videoFile: File,
    options: VideoProcessingOptions = {}
  ): Promise<VideoProcessingResult> {
    const {
      framesPerSecond = 1,
      sceneThreshold = 0.4,
      maxFrames = 300,
      thumbnailWidth = 320,
      thumbnailHeight = 180,
      onProgress = () => {},
    } = options;

    try {
      // Load FFmpeg if not already loaded
      await this.loadFFmpeg();
      onProgress(5, 'Initializing video processing...');

      // Write the input file to FFmpeg's virtual file system
      const inputFileName = `input-${Date.now()}.mp4`;
      this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(videoFile));
      onProgress(10, 'Analyzing video file...');

      // Get video metadata
      const metadata = await this.getVideoMetadata(inputFileName);
      onProgress(15, 'Retrieved video metadata');

      // Calculate how many frames to extract based on duration and fps
      const totalFramesToExtract = Math.min(
        Math.ceil(metadata.duration * framesPerSecond),
        maxFrames
      );

      // Extract frames
      const frames = await this.extractFrames(
        inputFileName,
        totalFramesToExtract,
        framesPerSecond,
        (progress) => onProgress(15 + progress * 0.4, 'Extracting video frames...')
      );
      onProgress(55, 'Frames extracted successfully');

      // Detect scenes
      const scenes = await this.detectScenes(
        inputFileName,
        sceneThreshold,
        frames,
        (progress) => onProgress(55 + progress * 0.3, 'Detecting scene changes...')
      );
      onProgress(85, 'Scene detection completed');

      // Generate thumbnails
      const thumbnails = await this.generateThumbnails(
        frames,
        thumbnailWidth,
        thumbnailHeight,
        (progress) => onProgress(85 + progress * 0.15, 'Generating thumbnails...')
      );
      onProgress(100, 'Video processing completed');

      // Clean up
      this.ffmpeg.FS('unlink', inputFileName);
      frames.forEach(frame => {
        if (frame.imagePath) {
          try {
            this.ffmpeg.FS('unlink', frame.imagePath);
          } catch (e) {
            // Ignore errors if file doesn't exist
          }
        }
      });

      return {
        frames,
        scenes,
        thumbnails,
        metadata
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error(`Failed to process video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get video metadata using FFmpeg
   * @param inputFileName The input file name in FFmpeg's file system
   * @returns Promise resolving to the video metadata
   * @private
   */
  private async getVideoMetadata(inputFileName: string): Promise<{
    duration: number;
    width: number;
    height: number;
    frameRate: number;
    filename: string;
  }> {
    try {
      // Run FFprobe to get video metadata
      await this.ffmpeg.run(
        '-i', inputFileName,
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,duration',
        '-show_entries', 'format=duration',
        '-of', 'json',
        'metadata.json'
      );

      // Read the metadata JSON
      const metadataBuffer = this.ffmpeg.FS('readFile', 'metadata.json');
      const metadataText = new TextDecoder().decode(metadataBuffer);
      const metadata = JSON.parse(metadataText);

      // Extract relevant information
      const stream = metadata.streams?.[0] || {};
      const format = metadata.format || {};
      
      // Parse frame rate (comes as a fraction like "30000/1001")
      let frameRate = 30;
      if (stream.r_frame_rate) {
        const [num, den] = stream.r_frame_rate.split('/').map(Number);
        if (den && num) {
          frameRate = num / den;
        }
      }

      // Get duration (prefer stream duration, fall back to format duration)
      const duration = parseFloat(stream.duration || format.duration || '0');

      return {
        duration,
        width: stream.width || 0,
        height: stream.height || 0,
        frameRate,
        filename: inputFileName
      };
    } catch (error) {
      console.error('Error getting video metadata:', error);
      throw new Error('Failed to extract video metadata');
    } finally {
      // Clean up
      try {
        this.ffmpeg.FS('unlink', 'metadata.json');
      } catch (e) {
        // Ignore if file doesn't exist
      }
    }
  }

  /**
   * Extract frames from a video file
   * @param inputFileName The input file name in FFmpeg's file system
   * @param totalFrames Total number of frames to extract
   * @param fps Frames per second to extract
   * @param onProgress Progress callback
   * @returns Promise resolving to the extracted frames
   * @private
   */
  private async extractFrames(
    inputFileName: string,
    totalFrames: number,
    fps: number,
    onProgress: (progress: number) => void
  ): Promise<Frame[]> {
    try {
      // Create output directory for frames
      const outputPattern = 'frame_%04d.jpg';

      // Extract frames using FFmpeg
      await this.ffmpeg.run(
        '-i', inputFileName,
        '-vf', `fps=${fps}`,
        '-q:v', '2', // High quality JPEG
        outputPattern
      );

      // Read the extracted frames
      const frames: Frame[] = [];
      for (let i = 1; i <= totalFrames; i++) {
        const frameFileName = `frame_${String(i).padStart(4, '0')}.jpg`;
        
        try {
          // Check if the frame exists
          this.ffmpeg.FS('readFile', frameFileName);
          
          // Calculate timestamp based on frame number and fps
          const timestamp = (i - 1) / fps * 1000; // Convert to milliseconds
          
          frames.push({
            id: `frame-${i}`,
            timestamp,
            frameNumber: i,
            imagePath: frameFileName,
            brightness: 0, // Will be calculated later if needed
            dominantColors: [] // Will be calculated later if needed
          });
          
          // Update progress
          onProgress(i / totalFrames);
        } catch (e) {
          // Stop if we can't find any more frames
          break;
        }
      }

      return frames;
    } catch (error) {
      console.error('Error extracting frames:', error);
      throw new Error('Failed to extract video frames');
    }
  }

  /**
   * Detect scene changes in a video
   * @param inputFileName The input file name in FFmpeg's file system
   * @param threshold Scene detection threshold (0-1)
   * @param frames Extracted frames
   * @param onProgress Progress callback
   * @returns Promise resolving to the detected scenes
   * @private
   */
  private async detectScenes(
    inputFileName: string,
    threshold: number,
    frames: Frame[],
    onProgress: (progress: number) => void
  ): Promise<Scene[]> {
    try {
      // Run FFmpeg with scene detection filter
      await this.ffmpeg.run(
        '-i', inputFileName,
        '-vf', `select='gt(scene\\,${threshold})',metadata=print`,
        '-f', 'null',
        '-'
      );

      // Get the FFmpeg log output which contains scene detection info
      const log = this.ffmpeg.getLog();
      
      // Parse the log to extract scene changes
      // Example log line: [Parsed_metadata_1 @ 0x55b5a2f0] frame:10 pts:10 pts_time:0.4 lavfi.scene_score=0.453125
      const sceneMatches = log.matchAll(/pts_time:([\d.]+).*?lavfi\.scene_score=([\d.]+)/g);
      const sceneChanges: { time: number, score: number }[] = [];
      
      for (const match of sceneMatches) {
        const time = parseFloat(match[1]) * 1000; // Convert to milliseconds
        const score = parseFloat(match[2]);
        sceneChanges.push({ time, score });
      }
      
      // Sort scene changes by time
      sceneChanges.sort((a, b) => a.time - b.time);
      
      // Create scenes from scene changes
      const scenes: Scene[] = [];
      let lastSceneTime = 0;
      
      // Always add the first scene starting at 0
      if (sceneChanges.length === 0 || sceneChanges[0].time > 0) {
        sceneChanges.unshift({ time: 0, score: 1.0 });
      }
      
      for (let i = 0; i < sceneChanges.length; i++) {
        const sceneStart = sceneChanges[i].time;
        const sceneEnd = (i < sceneChanges.length - 1) 
          ? sceneChanges[i + 1].time 
          : frames[frames.length - 1]?.timestamp || sceneStart + 5000; // Default 5 seconds if no end
        
        // Find key frames for this scene
        const sceneFrames = frames.filter(
          frame => frame.timestamp >= sceneStart && frame.timestamp < sceneEnd
        );
        
        // Only add scenes that have at least one frame and are longer than 500ms
        if (sceneFrames.length > 0 && (sceneEnd - sceneStart) >= 500) {
          scenes.push({
            id: `scene-${i}`,
            startTime: sceneStart,
            endTime: sceneEnd,
            duration: sceneEnd - sceneStart,
            sceneTypes: [SceneType.UNKNOWN], // Default type
            boundaryConfidence: sceneChanges[i].score,
            keyFrames: sceneFrames.length > 0 ? [sceneFrames[0]] : undefined
          });
        }
        
        lastSceneTime = sceneEnd;
        onProgress((i + 1) / sceneChanges.length);
      }
      
      return scenes;
    } catch (error) {
      console.error('Error detecting scenes:', error);
      
      // Fallback: create scenes based on time intervals if scene detection fails
      const fallbackScenes: Scene[] = [];
      const sceneInterval = 5000; // 5 seconds per scene
      const lastFrameTime = frames[frames.length - 1]?.timestamp || 0;
      
      for (let time = 0; time < lastFrameTime; time += sceneInterval) {
        const sceneFrames = frames.filter(
          frame => frame.timestamp >= time && frame.timestamp < time + sceneInterval
        );
        
        if (sceneFrames.length > 0) {
          fallbackScenes.push({
            id: `scene-${fallbackScenes.length}`,
            startTime: time,
            endTime: time + sceneInterval,
            duration: sceneInterval,
            sceneTypes: [SceneType.UNKNOWN],
            boundaryConfidence: 0.5, // Medium confidence for fallback scenes
            keyFrames: [sceneFrames[0]]
          });
        }
      }
      
      return fallbackScenes;
    }
  }

  /**
   * Generate thumbnails from extracted frames
   * @param frames Extracted frames
   * @param width Thumbnail width
   * @param height Thumbnail height
   * @param onProgress Progress callback
   * @returns Promise resolving to the generated thumbnails
   * @private
   */
  private async generateThumbnails(
    frames: Frame[],
    width: number,
    height: number,
    onProgress: (progress: number) => void
  ): Promise<{ timestamp: number, dataUrl: string }[]> {
    const thumbnails: { timestamp: number, dataUrl: string }[] = [];
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to create canvas context for thumbnails');
    }
    
    // Select frames to use as thumbnails (first frame of each scene or evenly spaced)
    const thumbnailFrames = frames.filter((_, index) => index % Math.ceil(frames.length / 20) === 0);
    
    for (let i = 0; i < thumbnailFrames.length; i++) {
      const frame = thumbnailFrames[i];
      
      try {
        if (frame.imagePath) {
          // Read the frame data from FFmpeg's file system
          const frameData = this.ffmpeg.FS('readFile', frame.imagePath);
          
          // Create an image from the frame data
          const img = new Image();
          const blob = new Blob([frameData], { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(blob);
          
          // Wait for the image to load
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
          });
          
          // Draw the image to the canvas, resizing it
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert the canvas to a data URL
          const dataUrl = canvas.convertToBlob ? 
            URL.createObjectURL(await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 })) : 
            'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
          
          thumbnails.push({
            timestamp: frame.timestamp,
            dataUrl
          });
          
          // Clean up
          URL.revokeObjectURL(imageUrl);
        }
      } catch (error) {
        console.error(`Error generating thumbnail for frame ${frame.frameNumber}:`, error);
        // Continue with other thumbnails
      }
      
      // Update progress
      onProgress((i + 1) / thumbnailFrames.length);
    }
    
    return thumbnails;
  }

  /**
   * Analyze a video file to detect scenes, motion, and energy levels
   * @param videoFile The video file to analyze
   * @param progressCallback Callback function to report progress
   * @returns Promise resolving to the analysis results
   */
  async analyzeVideo(
    videoFile: File, 
    progressCallback: (progress: number, step: string) => void
  ): Promise<VideoAnalysisResult> {
    try {
      // Process the video to extract frames and detect scenes
      const result = await this.processVideo(videoFile, {
        framesPerSecond: 1,
        sceneThreshold: 0.4,
        maxFrames: 300,
        thumbnailWidth: 320,
        thumbnailHeight: 180,
        onProgress: progressCallback
      });
      
      // Convert the scenes to the format expected by the application
      const scenes = result.scenes.map(scene => ({
        start: scene.startTime / 1000, // Convert to seconds
        end: scene.endTime / 1000, // Convert to seconds
        energy: Math.random() // Placeholder for energy level
      }));
      
      // Return the analysis results
      return {
        clip: {
          name: videoFile.name,
          duration: result.metadata.duration
        },
        scenes
      };
    } catch (error) {
      console.error('Error analyzing video:', error);
      throw new Error(`Failed to analyze video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract a thumbnail from a video file at a specific time
   * @param videoFile The video file
   * @param timeInSeconds The time to extract the thumbnail at
   * @returns Promise resolving to a data URL of the thumbnail
   */
  async extractThumbnail(videoFile: File, timeInSeconds: number): Promise<string> {
    try {
      // Load FFmpeg if not already loaded
      await this.loadFFmpeg();
      
      // Write the input file to FFmpeg's virtual file system
      const inputFileName = `input-${Date.now()}.mp4`;
      this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(videoFile));
      
      // Extract a single frame at the specified time
      const outputFileName = 'thumbnail.jpg';
      await this.ffmpeg.run(
        '-ss', timeInSeconds.toString(),
        '-i', inputFileName,
        '-vframes', '1',
        '-q:v', '2',
        outputFileName
      );
      
      // Read the thumbnail data
      const thumbnailData = this.ffmpeg.FS('readFile', outputFileName);
      
      // Convert to data URL
      const blob = new Blob([thumbnailData], { type: 'image/jpeg' });
      const dataUrl = URL.createObjectURL(blob);
      
      // Clean up
      this.ffmpeg.FS('unlink', inputFileName);
      this.ffmpeg.FS('unlink', outputFileName);
      
      return dataUrl;
    } catch (error) {
      console.error('Error extracting thumbnail:', error);
      // Return a placeholder image if extraction fails
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    }
  }
  
  /**
   * Get the duration of a video file
   * @param videoFile The video file
   * @returns Promise resolving to the duration in seconds
   */
  async getVideoDuration(videoFile: File): Promise<number> {
    try {
      // Load FFmpeg if not already loaded
      await this.loadFFmpeg();
      
      // Write the input file to FFmpeg's virtual file system
      const inputFileName = `input-${Date.now()}.mp4`;
      this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(videoFile));
      
      // Get video metadata
      const metadata = await this.getVideoMetadata(inputFileName);
      
      // Clean up
      this.ffmpeg.FS('unlink', inputFileName);
      
      return metadata.duration;
    } catch (error) {
      console.error('Error getting video duration:', error);
      // Return a default duration if extraction fails
      return 30;
    }
  }
}

export default VideoService;
