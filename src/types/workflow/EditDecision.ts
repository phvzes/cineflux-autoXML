
import { ClipType } from '../video-types';

export enum TransitionType {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE_IN = 'fade_in',
  FADE_OUT = 'fade_out',
  WIPE = 'wipe',
  NONE = 'none'
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

export const DEFAULT_EDIT_STYLES: Record<string, EditStyle> = {
  rhythmic: {
    id: 'rhythmic',
    name: 'Rhythmic',
    description: 'Cuts aligned with musical beats for a dynamic feel',
    averageShotDuration: 2.5,
    preferredTransitions: [TransitionType.CUT],
    clipTypePreferences: {
      [ClipType.DIALOGUE]: 0.2,
      [ClipType.B_ROLL]: 0.8,
      [ClipType.ESTABLISHING]: 0.3,
      [ClipType.TRANSITION]: 0.5,
      [ClipType.PERFORMANCE]: 0.9,
      [ClipType.B_ROLL_STATIC]: 0.6,
      [ClipType.B_ROLL_DYNAMIC]: 0.9,
      [ClipType.UNKNOWN]: 0.1
    },
    energyResponseFactor: 0.8,
    beatAlignmentStrength: 0.9
  },
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Longer shots with smooth transitions for a film-like feel',
    averageShotDuration: 4.0,
    preferredTransitions: [TransitionType.DISSOLVE, TransitionType.FADE_IN, TransitionType.FADE_OUT],
    clipTypePreferences: {
      [ClipType.DIALOGUE]: 0.7,
      [ClipType.B_ROLL]: 0.6,
      [ClipType.ESTABLISHING]: 0.9,
      [ClipType.TRANSITION]: 0.8,
      [ClipType.PERFORMANCE]: 0.7,
      [ClipType.B_ROLL_STATIC]: 0.5,
      [ClipType.B_ROLL_DYNAMIC]: 0.7,
      [ClipType.UNKNOWN]: 0.3
    },
    energyResponseFactor: 0.5,
    beatAlignmentStrength: 0.4
  },
  energetic: {
    id: 'energetic',
    name: 'Energetic',
    description: 'Fast-paced cuts that respond to audio energy',
    averageShotDuration: 1.5,
    preferredTransitions: [TransitionType.CUT, TransitionType.WIPE],
    clipTypePreferences: {
      [ClipType.DIALOGUE]: 0.3,
      [ClipType.B_ROLL]: 0.7,
      [ClipType.ESTABLISHING]: 0.2,
      [ClipType.TRANSITION]: 0.6,
      [ClipType.PERFORMANCE]: 0.9,
      [ClipType.B_ROLL_STATIC]: 0.4,
      [ClipType.B_ROLL_DYNAMIC]: 0.9,
      [ClipType.UNKNOWN]: 0.2
    },
    energyResponseFactor: 0.9,
    beatAlignmentStrength: 0.7
  }
};
