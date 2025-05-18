/**
 * Types for video processing and analysis
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
  UNKNOWN = 'unknown'
}

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
   * Additional plugin-specific options
   */
  [key: string]: unknown;
}

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
}

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

export interface VideoProcessingProgressCallback {
  (progress: number, step: string): void;
}

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
}

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
}

export interface ContentAnalysis {
  /**
   * Detected objects in the video
   */
  objects?: {
    label: string;
    confidence: number;
    time: number;
  }[];
  
  /**
   * Detected faces in the video
   */
  faces?: {
    count: number;
    time: number;
    positions?: { x: number; y: number; width: number; height: number }[];
  }[];
  
  /**
   * Detected text in the video
   */
  text?: {
    content: string;
    confidence: number;
    time: number;
    position?: { x: number; y: number; width: number; height: number };
  }[];
}

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
}
