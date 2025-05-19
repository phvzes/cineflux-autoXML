
/**
 * Types related to video processing and analysis
 */

export enum SceneType {
  DIALOGUE = 'dialogue',
  ACTION = 'action',
  ESTABLISHING = 'establishing',
  TRANSITION = 'transition',
  B_ROLL = 'b_roll',
  PERFORMANCE = 'performance',
  UNKNOWN = 'unknown'
}

export enum MarkerType {
  BEAT = 'beat',
  SEGMENT = 'segment',
  SCENE = 'scene',
  EDIT_POINT = 'edit_point',
  CUSTOM = 'custom'
}

export interface TimelineMarker {
  id: string;
  time: number;
  type: MarkerType;
  label?: string;
  color?: string;
  data?: any;
}

export enum ClipType {
  DIALOGUE = 'dialogue',
  B_ROLL = 'b_roll',
  ESTABLISHING = 'establishing',
  TRANSITION = 'transition',
  PERFORMANCE = 'performance',
  B_ROLL_STATIC = 'b_roll_static',
  B_ROLL_DYNAMIC = 'b_roll_dynamic',
  UNKNOWN = 'unknown'
}

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  duration?: number;
  type: SceneType;
  confidence: number;
  motionLevel?: number;
  brightness?: number;
  dominantColors?: string[];
  tags?: string[];
  thumbnail?: string;
}

export interface VideoFrame {
  id: string;
  timestamp: number;
  imageData?: ImageData;
  thumbnail?: string;
  motionLevel?: number;
  brightness?: number;
  dominantColors?: string[];
  tags?: string[];
}

export interface VideoAnalysis {
  id: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  scenes: Scene[];
  frames: VideoFrame[];
  dominantColors: string[];
  averageMotion: number;
  averageBrightness: number;
  tags: string[];
}

export interface VideoProcessingProgress {
  stage: string;
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  currentTime?: number;
  totalTime?: number;
  message?: string;
}

export interface VideoProcessingOptions {
  extractFrames?: boolean;
  frameInterval?: number;
  detectScenes?: boolean;
  analyzeMotion?: boolean;
  analyzeBrightness?: boolean;
  extractColors?: boolean;
  generateThumbnails?: boolean;
  classifyContent?: boolean;
}

export interface VideoFile {
  id: string;
  name: string;
  type: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  file: File;
  url?: string;
  thumbnail?: string;
  analysis?: VideoAnalysis;
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}
