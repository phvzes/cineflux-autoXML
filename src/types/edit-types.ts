/**
 * Types for edit decisions and timeline operations
 */
import { AudioAnalysis } from './audio-types';
import { Scene, VideoAnalysis } from './video-types';

export enum TransitionType {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE_IN = 'fadeIn',
  FADE_OUT = 'fadeOut',
  WIPE = 'wipe',
  PUSH = 'push',
  CUSTOM = 'custom'
}

export interface Transition {
  /**
   * Type of transition
   */
  type: TransitionType;
  
  /**
   * Duration of the transition in seconds
   */
  duration: number;
  
  /**
   * Additional parameters for the transition
   */
  params?: Record<string, unknown>;
}

export interface EditDecision {
  /**
   * Unique identifier for this edit decision
   */
  id: string;
  
  /**
   * Index of the video file to use
   */
  videoIndex: number;
  
  /**
   * Scene to use from the video
   */
  scene: Scene;
  
  /**
   * Start time in the source video (seconds)
   */
  sourceStartTime: number;
  
  /**
   * End time in the source video (seconds)
   */
  sourceEndTime: number;
  
  /**
   * Start time in the output timeline (seconds)
   */
  timelineStartTime: number;
  
  /**
   * End time in the output timeline (seconds)
   */
  timelineEndTime: number;
  
  /**
   * Duration of this edit in the timeline (seconds)
   */
  duration: number;
  
  /**
   * Transition to use for this edit
   */
  transition?: Transition;
  
  /**
   * Whether this edit is enabled
   */
  enabled: boolean;
  
  /**
   * Additional metadata for this edit
   */
  metadata?: Record<string, unknown>;
}

export interface TimelineMarker {
  /**
   * Time in seconds on the timeline
   */
  time: number;
  
  /**
   * Label for the marker
   */
  label: string;
  
  /**
   * Type of marker
   */
  type: string;
  
  /**
   * Color for the marker
   */
  color?: string;
}

export interface EditDecisionList {
  /**
   * Unique identifier for this EDL
   */
  id: string;
  
  /**
   * Name of the EDL
   */
  name: string;
  
  /**
   * Array of edit decisions
   */
  decisions: EditDecision[];
  
  /**
   * Total duration of the timeline in seconds
   */
  duration: number;
  
  /**
   * Timeline markers
   */
  markers: TimelineMarker[];
  
  /**
   * Creation date
   */
  createdAt: Date;
  
  /**
   * Last modified date
   */
  updatedAt: Date;
}

export interface EditDecisionStats {
  /**
   * Total number of edits
   */
  totalEdits: number;
  
  /**
   * Average edit duration in seconds
   */
  averageEditDuration: number;
  
  /**
   * Number of each transition type
   */
  transitionCounts: Record<TransitionType, number>;
  
  /**
   * Total timeline duration in seconds
   */
  totalDuration: number;
}

export interface EditDecisionEngineOptions {
  /**
   * Minimum edit duration in seconds
   */
  minEditDuration?: number;
  
  /**
   * Maximum edit duration in seconds
   */
  maxEditDuration?: number;
  
  /**
   * Target edit rate (edits per minute)
   */
  targetEditRate?: number;
  
  /**
   * Whether to align edits with beats
   */
  alignWithBeats?: boolean;
  
  /**
   * Preferred transition type
   */
  preferredTransition?: TransitionType;
  
  /**
   * Default transition duration in seconds
   */
  defaultTransitionDuration?: number;
  
  /**
   * Additional options
   */
  [key: string]: unknown;
}

export enum EditDecisionEngineEvents {
  PROGRESS = 'progress',
  COMPLETE = 'complete',
  ERROR = 'error',
  EDIT_ADDED = 'editAdded',
  EDIT_REMOVED = 'editRemoved',
  EDIT_UPDATED = 'editUpdated'
}

export interface EditDecisionEngineResult {
  /**
   * Generated edit decision list
   */
  editDecisionList: EditDecisionList;
  
  /**
   * Statistics about the generated edits
   */
  stats: EditDecisionStats;
  
  /**
   * Audio analysis used for the edit decisions
   */
  audioAnalysis: AudioAnalysis;
  
  /**
   * Video analyses used for the edit decisions
   */
  videoAnalyses: VideoAnalysis[];
}
