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
}

export interface VideoFrame {
  id: string;
  index: number;
  timestamp: number;
  imageData: ImageData | null;
  url?: string;
  width: number;
  height: number;
  sceneId?: string;
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
  type: SceneType;
  score: number;
  motion: number;
  brightness: number;
  contrast: number;
  colorfulness: number;
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

export interface VideoAnalysis {
  videoId: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  frames: VideoFrame[];
  scenes: Scene[];
  motionData: number[];
  brightnessData: number[];
  contrastData: number[];
  colorfulnessData: number[];
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
