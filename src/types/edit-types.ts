/**
 * edit-types.ts
 * 
 * Central definitions for edit-related types used throughout the application.
 */

import { VideoAnalysis } from './video-types';
import { AudioAnalysis } from './audio-types';

/**
 * Enum for transition types
 */
export enum TransitionType {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE = 'fade',
  WIPE = 'wipe',
  ZOOM = 'zoom',
  SLIDE = 'slide',
  NONE = 'none'
}

/**
 * Enum for scene types
 */
export enum SceneType {
  PERFORMANCE = 'performance',
  B_ROLL = 'b-roll',
  TRANSITION = 'transition',
  ACTION = 'action',
  DIALOGUE = 'dialogue',
  ESTABLISHING = 'establishing',
  CLOSEUP = 'closeup',
  WIDE = 'wide',
  MEDIUM = 'medium'
}

/**
 * Interface for edit decision
 */
export interface EditDecision {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  videoFileId?: string;
  sourceStartTime?: number;
  sourceEndTime?: number;
  transitionType?: TransitionType;
  transitionDuration?: number;
  sceneType?: SceneType;
  notes?: string;
  tags?: string[];
  isSelected?: boolean;
}

/**
 * Interface for edit decision list
 */
export interface EditDecisionList {
  id: string;
  name: string;
  decisions: EditDecision[];
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for edit settings
 */
export interface EditSettings {
  minClipDuration: number;
  maxClipDuration: number;
  preferredTransition: TransitionType;
  defaultTransitionDuration: number;
  beatSyncEnabled: boolean;
  energySyncEnabled: boolean;
  sceneTypePreferences: Record<SceneType, number>; // Preference weight for each scene type
}

/**
 * Interface for edit generation options
 */
export interface EditGenerationOptions {
  targetDuration?: number;
  musicTrackId?: string;
  settings?: EditSettings;
  preferredSceneTypes?: SceneType[];
  avoidSceneTypes?: SceneType[];
  startTime?: number;
  endTime?: number;
}

/**
 * Interface for edit generation result
 */
export interface EditGenerationResult {
  decisions: EditDecision[];
  totalDuration: number;
  clipCount: number;
  averageClipDuration: number;
  musicTrackId?: string;
  settings: EditSettings;
}

/**
 * Interface for edit engine
 */
export interface EditEngine {
  generateEdit: (
    videoAnalyses: VideoAnalysis[],
    audioAnalysis: AudioAnalysis,
    options: EditGenerationOptions
  ) => Promise<EditGenerationResult>;
  
  optimizeEdit: (
    decisions: EditDecision[],
    videoAnalyses: VideoAnalysis[],
    audioAnalysis: AudioAnalysis,
    options: EditGenerationOptions
  ) => Promise<EditGenerationResult>;
  
  saveEdit: (
    decisions: EditDecision[],
    name: string
  ) => Promise<EditDecisionList>;
  
  loadEdit: (
    id: string
  ) => Promise<EditDecisionList>;
}
