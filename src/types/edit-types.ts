/**
 * Types related to edit decisions and video editing
 */

import { AudioAnalysis, Beat, Segment } from './audio-types';
import { Scene, VideoAnalysis, ClipType } from './video-types';
import { TransitionType } from './workflow/EditDecision';

export interface EditPoint {
  time: number;
  type: 'beat' | 'segment' | 'energy' | 'manual';
  confidence: number;
  beat?: Beat;
  segment?: Segment;
  energyLevel?: number;
}

export interface EditMatch {
  editPoint: EditPoint;
  scene: Scene;
  videoFileId: string;
  matchScore: number;
  clipType: ClipType;
}

export interface EditDecision {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  videoFileId: string;
  videoStartTime: number;
  videoEndTime: number;
  clipType: ClipType;
  transition: TransitionType;
  confidence: number;
  matchScore?: number;
  tags?: string[];
  clipIndex?: number;
  time?: number; // For backward compatibility
}

export interface EditSequence {
  id: string;
  name: string;
  decisions: EditDecision[];
  totalDuration: number;
  audioFileId: string;
}

export interface EditStyle {
  id: string;
  name: string;
  description: string;
  averageShotDuration: number;
  preferredTransitions: TransitionType[];
  clipTypePreferences: Record<ClipType, number>;
  energyResponseFactor: number;
  beatAlignmentStrength: number;
}

export interface EditSettings {
  style: EditStyle;
  minClipDuration: number;
  maxClipDuration: number;
  preferredTransition: TransitionType;
  beatAlignmentEnabled: boolean;
  energyResponseEnabled: boolean;
  contentMatchingEnabled: boolean;
  allowContentRepetition: boolean;
  clipTypeWeights: Record<ClipType, number>;
}

export interface EditGenerationOptions {
  audioAnalysis: AudioAnalysis;
  videoAnalyses: Record<string, VideoAnalysis>;
  settings: EditSettings;
  maxDuration?: number;
  startTime?: number;
  endTime?: number;
}

export const DEFAULT_EDIT_SETTINGS: EditSettings = {
  style: {
    id: 'default',
    name: 'Default',
    description: 'Balanced edit style with moderate pacing',
    averageShotDuration: 3.0,
    preferredTransitions: [TransitionType.CUT],
    clipTypePreferences: {
      [ClipType.DIALOGUE]: 0.5,
      [ClipType.B_ROLL]: 0.7,
      [ClipType.ESTABLISHING]: 0.6,
      [ClipType.TRANSITION]: 0.5,
      [ClipType.PERFORMANCE]: 0.8,
      [ClipType.B_ROLL_STATIC]: 0.6,
      [ClipType.B_ROLL_DYNAMIC]: 0.8,
      [ClipType.UNKNOWN]: 0.3
    },
    energyResponseFactor: 0.7,
    beatAlignmentStrength: 0.6
  },
  minClipDuration: 1.0,
  maxClipDuration: 6.0,
  preferredTransition: TransitionType.CUT,
  beatAlignmentEnabled: true,
  energyResponseEnabled: true,
  contentMatchingEnabled: true,
  allowContentRepetition: false,
  clipTypeWeights: {
    [ClipType.DIALOGUE]: 0.5,
    [ClipType.B_ROLL]: 0.7,
    [ClipType.ESTABLISHING]: 0.6,
    [ClipType.TRANSITION]: 0.5,
    [ClipType.PERFORMANCE]: 0.8,
    [ClipType.B_ROLL_STATIC]: 0.6,
    [ClipType.B_ROLL_DYNAMIC]: 0.8,
    [ClipType.UNKNOWN]: 0.3
  }
};
