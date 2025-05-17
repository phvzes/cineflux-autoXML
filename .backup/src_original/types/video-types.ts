/**
 * Type definitions for video processing and analysis in CineFlux-AutoXML
 */

/**
 * Represents a video file with metadata
 */
export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  blobUrl: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  thumbnail: string;
  metadata: VideoMetadata;
}

/**
 * Metadata extracted from video file
 */
export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec?: string;
  bitrate?: number;
}

/**
 * Represents a frame extracted from a video
 */
export interface VideoFrame {
  index: number;
  time: number;
  imageData: ImageData;
  width: number;
  height: number;
  thumbnail: string;
}

/**
 * Represents a scene detected in a video
 */
export interface Scene {
  id: string;
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  duration: number;
  keyFrameIndex: number; // Index of the representative frame
}

/**
 * RGB color representation
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Content analysis data for a video frame or scene
 */
export interface ContentData {
  hasFaces: boolean;
  faceCount: number;
  dominantColors: RGBColor[];
  brightness: number; // 0-255
  contrast: number;
  hasText: boolean;
  isOutdoor: boolean;
  hasMotion: boolean;
}

/**
 * Motion analysis data for a frame
 */
export interface FrameMotion {
  frameIndex: number;
  time: number;
  motionAmount: number;
}

/**
 * Motion analysis data for the entire video
 */
export interface MotionData {
  averageMotion: number;
  motionByFrame: FrameMotion[];
  hasHighMotion: boolean;
  hasCameraMovement: boolean;
}

/**
 * Classification of clip types
 */
export enum ClipType {
  PERFORMANCE = 'performance',
  B_ROLL_STATIC = 'b-roll-static',
  B_ROLL_DYNAMIC = 'b-roll-dynamic',
  ACTION = 'action',
  UNKNOWN = 'unknown'
}

/**
 * Complete video analysis result
 */
export interface VideoAnalysis {
  videoId: string;
  duration: number;
  frameCount: number;
  scenes: Scene[];
  contentAnalysis: ContentData[];
  motionData: MotionData;
  clipType: ClipType;
}

/**
 * Options for frame extraction
 */
export interface FrameExtractionOptions {
  fps?: number; // Frames per second to extract
  maxFrames?: number; // Maximum number of frames to extract
  quality?: number; // Quality of extracted frames (1-100)
}

/**
 * Options for scene detection
 */
export interface SceneDetectionOptions {
  threshold?: number; // Threshold for scene change detection (0-255)
  minSceneDuration?: number; // Minimum scene duration in seconds
}

/**
 * Events emitted by VideoService
 */
export enum VideoServiceEvents {
  ANALYSIS_START = 'analysis:start',
  ANALYSIS_COMPLETE = 'analysis:complete',
  PROGRESS = 'progress',
  ERROR = 'error',
  FRAME_EXTRACTED = 'frame:extracted',
  SCENE_DETECTED = 'scene:detected'
}

/**
 * Video timeline marker types
 */
export enum MarkerType {
  SCENE_BOUNDARY = 'scene-boundary',
  KEYFRAME = 'keyframe',
  TRANSITION = 'transition',
  EDIT_POINT = 'edit-point'
}

/**
 * Represents a marker on the video timeline
 */
export interface TimelineMarker {
  id: string;
  type: MarkerType;
  time: number;
  label?: string;
  color?: string;
  data?: any;
}

/**
 * Options for thumbnail generation
 */
export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  frame?: number; // Frame number to use (default: middle frame)
  time?: number; // Time in seconds to use (alternative to frame)
}

/**
 * Video timeline configuration
 */
export interface VideoTimelineConfig {
  width: number;
  height: number;
  secondsVisible: number;
  zoomLevel: number;
  showThumbnails: boolean;
  showMarkers: boolean;
  showWaveform: boolean;
}

/**
 * Video player configuration
 */
export interface VideoPlayerConfig {
  autoPlay: boolean;
  loop: boolean;
  volume: number;
  playbackRate: number;
  showControls: boolean;
}

/**
 * Video processing progress information
 */
export interface VideoProcessingProgress {
  stage: string;
  progress: number; // 0-1
  message: string;
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeRemaining?: number; // in seconds
}