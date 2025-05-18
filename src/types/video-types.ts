/**
 * Types for video processing and analysis
 */

/**
 * Enum for different types of video clips
 */
export enum ClipType {
  WIDE = 'wide',
  MEDIUM = 'medium',
  CLOSE_UP = 'closeUp',
  EXTREME_CLOSE_UP = 'extremeCloseUp',
  ESTABLISHING = 'establishing',
  ACTION = 'action',
  REACTION = 'reaction',
  CUTAWAY = 'cutaway',
  UNKNOWN = 'unknown',
  PERFORMANCE = 'performance',
  B_ROLL_STATIC = 'bRollStatic',
  B_ROLL_DYNAMIC = 'bRollDynamic'
}

/**
 * Video Processing Options
 */
export interface VideoProcessingOptions {
  /**
   * Maximum width to process
   */
  maxWidth?: number;
  
  /**
   * Maximum height to process
   */
  maxHeight?: number;
  
  /**
   * Duration in seconds to process (0 for entire file)
   */
  duration?: number;
  
  /**
   * Start time in seconds
   */
  startTime?: number;
  
  /**
   * Frame rate to process at
   */
  frameRate?: number;
  
  /**
   * Whether to analyze audio in the video
   */
  includeAudio?: boolean;
  
  /**
   * Maximum number of frames to process
   */
  maxFrames?: number;
  
  /**
   * Interval between frames in seconds
   */
  frameInterval?: number;
  
  /**
   * Quality of extracted frames (0.0 to 1.0)
   */
  quality?: number;
  
  /**
   * Whether to use WebAssembly for processing
   */
  useWasm?: boolean;
  
  /**
   * Sensitivity for scene detection (0.0 to 1.0)
   */
  sceneSensitivity?: number;
  
  /**
   * Additional plugin-specific options
   */
  [key: string]: unknown;
}

/**
 * Scene Detection Options
 */
export interface SceneDetectionOptions extends VideoProcessingOptions {
  /**
   * Threshold for scene detection (0-1)
   */
  threshold?: number;
  
  /**
   * Minimum scene duration in seconds
   */
  minSceneDuration?: number;
}

/**
 * Frame Extraction Options
 */
export interface FrameExtractionOptions extends VideoProcessingOptions {
  /**
   * Number of frames to extract (0 for automatic)
   */
  count?: number;
  
  /**
   * Interval between frames in seconds (0 for automatic)
   */
  interval?: number;
  
  /**
   * Quality of extracted frames (0-1)
   */
  quality?: number;
  
  /**
   * Format of extracted frames ('jpeg', 'png', etc.)
   */
  format?: string;
  
  /**
   * Maximum number of frames to extract
   */
  maxFrames?: number;
}

/**
 * Thumbnail Options
 */
export interface ThumbnailOptions {
  /**
   * Width of the thumbnail
   */
  width?: number;
  
  /**
   * Height of the thumbnail
   */
  height?: number;
  
  /**
   * Quality of the thumbnail (0-1)
   */
  quality?: number;
  
  /**
   * Format of the thumbnail ('jpeg', 'png', etc.)
   */
  format?: string;
}

/**
 * Video Processing Progress Callback
 */
export type VideoProcessingProgressCallback = (progress: number, step?: string) => void;

/**
 * Video Frame
 */
export interface VideoFrame {
  /**
   * Time in seconds when the frame occurs
   */
  time: number;
  
  /**
   * Data URL of the frame image
   */
  dataUrl: string;
  
  /**
   * Width of the frame
   */
  width: number;
  
  /**
   * Height of the frame
   */
  height: number;
  
  /**
   * Dominant colors in the frame
   */
  dominantColors?: string[];
  
  /**
   * Brightness value (0-1)
   */
  brightness?: number;
  
  /**
   * Contrast value (0-1)
   */
  contrast?: number;
  
  /**
   * Motion blur detection (0-1)
   */
  motionBlur?: number;
}

/**
 * Scene
 */
export interface Scene {
  /**
   * Unique identifier for this scene
   */
  id: string;
  
  /**
   * Start time in seconds
   */
  startTime: number;
  
  /**
   * End time in seconds
   */
  endTime: number;
  
  /**
   * Duration in seconds
   */
  duration: number;
  
  /**
   * Representative frame for this scene
   */
  keyFrame?: VideoFrame;
  
  /**
   * Type of shot in this scene
   */
  clipType?: ClipType;
  
  /**
   * Motion level in this scene (0-1)
   */
  motionLevel?: number;
  
  /**
   * Brightness level in this scene (0-1)
   */
  brightness?: number;
  
  /**
   * Contrast level in this scene (0-1)
   */
  contrast?: number;
  
  /**
   * Additional metadata for this scene
   */
  metadata?: Record<string, unknown>;
  
  /**
   * URL of the key frame image
   */
  keyFrameUrl?: string;
}

/**
 * Motion Data
 */
export interface MotionData {
  /**
   * Time in seconds
   */
  time: number;
  
  /**
   * Motion value (0-1)
   */
  value: number;
  
  /**
   * Direction of motion (degrees, 0-360)
   */
  direction?: number;
  
  /**
   * Motion data by frame
   */
  motionByFrame?: Array<{
    /**
     * Frame index
     */
    frameIndex: number;
    
    /**
     * Motion value (0-1)
     */
    value: number;
    
    /**
     * Direction of motion (degrees, 0-360)
     */
    direction?: number;
  }>;
}

/**
 * Content Analysis
 */
export interface ContentAnalysis {
  /**
   * Detected objects in the video
   */
  objects?: Array<{
    label: string;
    confidence: number;
    time: number;
  }>;
  
  /**
   * Detected faces in the video
   */
  faces?: Array<{
    count: number;
    time: number;
    positions?: Array<{ x: number; y: number; width: number; height: number }>;
  }>;
  
  /**
   * Detected text in the video
   */
  text?: Array<{
    content: string;
    confidence: number;
    time: number;
    position?: { x: number; y: number; width: number; height: number };
  }>;
}

/**
 * Video Analysis
 */
export interface VideoAnalysis {
  /**
   * Unique identifier for this analysis
   */
  id: string;
  
  /**
   * Duration of the video in seconds
   */
  duration: number;
  
  /**
   * Width of the video
   */
  width: number;
  
  /**
   * Height of the video
   */
  height: number;
  
  /**
   * Frame rate of the video
   */
  frameRate: number;
  
  /**
   * Detected scenes in the video
   */
  scenes: Scene[];
  
  /**
   * Extracted frames from the video
   */
  frames?: VideoFrame[];
  
  /**
   * Motion data over time
   */
  motionData: MotionData[];
  
  /**
   * Content analysis results
   */
  contentAnalysis?: ContentAnalysis;
  
  /**
   * Clip type classification for the video
   */
  clipType?: ClipType;
  
  /**
   * Additional metadata from the analysis
   */
  metadata?: Record<string, unknown>;
  
  /**
   * Resolution of the video
   */
  resolution?: { width: number; height: number };
  
  /**
   * Content analysis by frame index
   */
  contentAnalysisByFrame?: ContentAnalysis[];
  
  /**
   * Video ID for reference
   */
  videoId?: string;
}

/**
 * Video Processing Result
 */
export interface VideoProcessingResult {
  /**
   * Video analysis data
   */
  analysis: VideoAnalysis;
  
  /**
   * Extracted frames
   */
  frames?: VideoFrame[];
  
  /**
   * Generated thumbnails
   */
  thumbnails?: Array<{
    time: number;
    dataUrl: string;
  }>;
  
  /**
   * Processing metadata
   */
  metadata?: {
    processingTime: number;
    usedWasm: boolean;
    originalSize: number;
    processedSize: number;
  };
}

/**
 * FFmpeg Processing Options
 */
export interface FFmpegProcessOptions {
  /**
   * Input file path or URL
   */
  input: string;
  
  /**
   * Output file path
   */
  output: string;
  
  /**
   * FFmpeg command arguments
   */
  args?: string[];
  
  /**
   * Whether to log FFmpeg output
   */
  log?: boolean;
  
  /**
   * Progress callback
   */
  progress?: (progress: number) => void;
}

/**
 * OpenCV Processing Result
 */
export interface OpenCVProcessResult {
  /**
   * Processed image data
   */
  data: Uint8Array | null;
  
  /**
   * Width of the processed image
   */
  width: number;
  
  /**
   * Height of the processed image
   */
  height: number;
  
  /**
   * Number of channels in the processed image
   */
  channels: number;
  
  /**
   * Processing metadata
   */
  metadata?: {
    processingTime: number;
    originalSize: number;
    processedSize: number;
  };
}

/**
 * Video Frame Data
 */
export interface VideoFrameData {
  /**
   * Raw frame data
   */
  data: Uint8Array;
  
  /**
   * Width of the frame
   */
  width: number;
  
  /**
   * Height of the frame
   */
  height: number;
  
  /**
   * Number of channels in the frame
   */
  channels: number;
  
  /**
   * Time in seconds when the frame occurs
   */
  time: number;
  
  /**
   * Frame index
   */
  index: number;
}
