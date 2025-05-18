/**
 * video-types.ts
 * 
 * Type definitions for video processing
 */

export interface Scene {
  startTime: number;
  endTime: number;
  type?: string;
  confidence?: number;
  thumbnail?: string;
}

export interface VideoFrame {
  time: number;
  image: string;
  width: number;
  height: number;
}

export enum MarkerType {
  SCENE_BOUNDARY = 'scene_boundary',
  KEYFRAME = 'keyframe',
  TRANSITION = 'transition',
  EDIT_POINT = 'edit_point',
  CUSTOM = 'custom'
}

export interface TimelineMarker {
  id: string;
  time: number;
  type: MarkerType;
  label?: string;
  data?: any;
}

export interface VideoAnalysis {
  duration: number;
  width: number;
  height: number;
  fps: number;
  scenes: Scene[];
  frames: VideoFrame[];
}
