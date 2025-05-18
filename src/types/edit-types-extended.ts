/**
 * Extended edit decision types
 */
import { AudioSegment, Beat } from './audio-types';
import { Scene } from './video-types';
import { EditDecision, TransitionType } from './edit-types';

/**
 * Enum for different edit point types
 */
export enum EditPointType {
  BEAT = 'beat',
  SEGMENT_BOUNDARY = 'segmentBoundary',
  ENERGY_PEAK = 'energyPeak',
  ENERGY_VALLEY = 'energyValley',
  SCENE_CHANGE = 'sceneChange',
  MANUAL = 'manual',
  REGULAR_INTERVAL = 'regularInterval'
}

/**
 * Interface for an edit point
 */
export interface EditPoint {
  /**
   * Unique identifier for this edit point
   */
  id: string;
  
  /**
   * Time in seconds where the edit point occurs
   */
  time: number;
  
  /**
   * Type of edit point
   */
  type: EditPointType;
  
  /**
   * Importance score (0-1) for this edit point
   */
  importance: number;
  
  /**
   * Energy level (0-1) at this edit point
   */
  energy: number;
  
  /**
   * Associated beat if this is a beat-based edit point
   */
  beat?: Beat;
  
  /**
   * Associated segment if this is a segment-based edit point
   */
  segment?: AudioSegment;
  
  /**
   * Associated scene if this is a scene-based edit point
   */
  scene?: Scene;
  
  /**
   * Whether this edit point is on a beat
   */
  onBeat: boolean;
  
  /**
   * Recommended transition type for this edit point
   */
  recommendedTransition: TransitionType;
  
  /**
   * Additional metadata for this edit point
   */
  metadata?: Record<string, unknown>;
}

/**
 * Enum for different edit styles
 */
export enum EditStyle {
  MUSIC_VIDEO = 'musicVideo',
  DOCUMENTARY = 'documentary',
  ACTION = 'action',
  DRAMA = 'drama',
  COMEDY = 'comedy',
  COMMERCIAL = 'commercial',
  VLOG = 'vlog',
  CINEMATIC = 'cinematic',
  EXPERIMENTAL = 'experimental',
  CUSTOM = 'custom'
}

/**
 * Interface for video clip assignment
 */
export interface VideoClipAssignment {
  /**
   * Video file index
   */
  videoIndex: number;
  
  /**
   * Scene from the video
   */
  scene: Scene;
  
  /**
   * Edit decision that uses this clip
   */
  editDecision: EditDecision;
  
  /**
   * Score for this assignment (0-1)
   */
  score: number;
  
  /**
   * Reason for this assignment
   */
  reason: string;
}

/**
 * Interface for project settings
 */
export interface ProjectSettings {
  /**
   * Edit style to use
   */
  editStyle: EditStyle;
  
  /**
   * Target edit rate (edits per minute)
   */
  targetEditRate: number;
  
  /**
   * Minimum edit duration in seconds
   */
  minEditDuration: number;
  
  /**
   * Maximum edit duration in seconds
   */
  maxEditDuration: number;
  
  /**
   * Whether to align edits with beats
   */
  alignWithBeats: boolean;
  
  /**
   * Preferred transition type
   */
  preferredTransition: TransitionType;
  
  /**
   * Default transition duration in seconds
   */
  defaultTransitionDuration: number;
  
  /**
   * Output resolution width
   */
  outputWidth: number;
  
  /**
   * Output resolution height
   */
  outputHeight: number;
  
  /**
   * Output frame rate
   */
  outputFrameRate: number;
  
  /**
   * Output file format
   */
  outputFormat: string;
  
  /**
   * Additional settings
   */
  [key: string]: unknown;
}
