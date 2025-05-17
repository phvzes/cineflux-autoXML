/**
 * video-types.ts
 * 
 * Type definitions for video processing functionality.
 */

export interface VideoFile {
  file: File;
  id: string;
  name: string;
  type: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  thumbnail?: string;
  metadata?: VideoMetadata;
  blobUrl?: string;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec?: string;
  bitrate?: number;
}

export interface VideoFrame {
  index: number;
  time: number;
  imageData: ImageData;
  width: number;
  height: number;
  thumbnail?: string;
}

export interface Scene {
  id: string;
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  duration: number;
  keyFrameIndex: number;
  keyFrameUrl?: string;
  type?: SceneType;
  score?: number;
  motion?: number;
  brightness?: number;
  contrast?: number;
  colorfulness?: number;
}

export enum SceneType {
  ESTABLISHING = 'establishing',
  ACTION = 'action',
  DIALOGUE = 'dialogue',
  TRANSITION = 'transition',
  CUTAWAY = 'cutaway',
  CLOSEUP = 'closeup',
  WIDE = 'wide',
  UNKNOWN = 'unknown'
}

export enum ClipType {
  PERFORMANCE = 'performance',
  ACTION = 'action',
  B_ROLL_STATIC = 'b-roll-static',
  B_ROLL_DYNAMIC = 'b-roll-dynamic',
  UNKNOWN = 'unknown'
}

export interface ContentData {
  hasFaces: boolean;
  faceCount: number;
  dominantColors: Array<{r: number, g: number, b: number}>;
  brightness: number;
  contrast: number;
  hasText: boolean;
  isOutdoor: boolean;
  hasMotion: boolean;
}

export interface MotionData {
  averageMotion: number;
  motionByFrame: Array<{frameIndex: number, time: number, motionAmount: number}>;
  hasHighMotion: boolean;
  hasCameraMovement: boolean;
}

export interface VideoAnalysis {
  videoId: string;
  duration: number;
  frameCount: number;
  scenes: Scene[];
  contentAnalysis: ContentData[];
  motionData: MotionData;
  clipType: ClipType;
}

export interface VideoProcessingOptions {
  fps?: number;
  maxFrames?: number;
  sceneDetection?: boolean;
  motionAnalysis?: boolean;
  onProgress?: (progress: number) => void;
}

export interface VideoProcessingResult {
  frames: VideoFrame[];
  scenes: Scene[];
  duration: number;
  width: number;
  height: number;
  fps: number;
}

export interface FrameExtractionOptions {
  fps?: number;
  maxFrames?: number;
}

export interface SceneDetectionOptions {
  threshold?: number;
}

export interface TimelineMarker {
  id: string;
  time: number;
  type: MarkerType;
  label?: string;
  data?: any;
}

export enum MarkerType {
  SCENE_BOUNDARY = 'scene-boundary',
  KEYFRAME = 'keyframe',
  CUSTOM = 'custom'
}

export enum VideoServiceEvents {
  ANALYSIS_START = 'analysis-start',
  ANALYSIS_COMPLETE = 'analysis-complete',
  PROGRESS = 'progress',
  ERROR = 'error'
}
