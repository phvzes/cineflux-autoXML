/**
 * edit-types.ts
 * 
 * Type definitions for edit decision functionality.
 */

import { Scene, VideoFile } from './video-types';
import { AudioAnalysis, Beat } from './audio-types';

export interface EditDecision {
  id: string;
  videoId: string;
  sceneId: string;
  startTime: number;
  endTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  transitionIn?: Transition;
  transitionOut?: Transition;
  scene?: Scene;
  beat?: Beat;
  score: number;
  type: EditDecisionType;
  metadata: Record<string, any>;
}

export enum EditDecisionType {
  CUT = 'cut',
  BEAT_SYNC = 'beat-sync',
  ENERGY_SYNC = 'energy-sync',
  SCENE_CHANGE = 'scene-change',
  MANUAL = 'manual'
}

export interface Transition {
  id: string;
  type: TransitionType;
  duration: number;
  parameters: Record<string, any>;
}

export enum TransitionType {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE_IN = 'fade-in',
  FADE_OUT = 'fade-out',
  WIPE_LEFT = 'wipe-left',
  WIPE_RIGHT = 'wipe-right',
  WIPE_UP = 'wipe-up',
  WIPE_DOWN = 'wipe-down',
  ZOOM_IN = 'zoom-in',
  ZOOM_OUT = 'zoom-out',
  CUSTOM = 'custom'
}

export interface EditDecisionList {
  id: string;
  name: string;
  decisions: EditDecision[];
  videoFiles: VideoFile[];
  audioAnalysis?: AudioAnalysis;
  totalDuration: number;
  createdAt: number;
  updatedAt: number;
}

export interface EditSettings {
  pacing: number;
  beatSyncStrength: number;
  energySyncStrength: number;
  minClipDuration: number;
  maxClipDuration: number;
  preferredTransition: TransitionType;
  transitionDuration: number;
  allowSceneChanges: boolean;
  allowBeatSync: boolean;
  allowEnergySync: boolean;
}
