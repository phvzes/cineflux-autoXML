/**
 * Types for edit decisions and timeline operations
 */
import { AudioAnalysis } from './audio-types';
import { Scene, VideoAnalysis } from './video-types';

/**
 * Enum representing different types of transitions
 */
export enum TransitionType {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE_IN = 'fadeIn',
  FADE_OUT = 'fadeOut',
  WIPE = 'wipe',
  PUSH = 'push',
  CUSTOM = 'custom'
}

/**
 * Interface representing a transition between edits
 */
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

/**
 * Interface representing an edit decision in the workflow
 */
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
  
  /**
   * Time position in the timeline
   */
  time?: number;
  
  /**
   * Clip index
   */
  clipIndex?: number;
  
  /**
   * Whether this edit is on a beat
   */
  onBeat?: boolean;
  
  /**
   * Segment information
   */
  segment?: any;
  
  /**
   * Beat information
   */
  beat?: any;
  
  /**
   * Energy level
   */
  energy?: number;
  
  /**
   * Importance level
   */
  importance?: number;
}

/**
 * Interface representing a timeline marker
 */
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

/**
 * Interface representing an edit decision list
 */
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
  markers?: TimelineMarker[];
  
  /**
   * Creation date
   */
  createdAt?: Date;
  
  /**
   * Last modified date
   */
  updatedAt?: Date;
}

/**
 * Interface representing edit decision statistics
 */
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
  
  /**
   * Total number of cuts in the edit (optional)
   */
  totalCuts?: number;
  
  /**
   * Score representing how well cuts align with beats (0-1) (optional)
   */
  beatAlignmentScore?: number;
}

/**
 * Configuration options for the EditDecisionEngine
 */
export interface EditDecisionEngineConfig {
  /** Percentage of beats to use for cuts (0-100) */
  beatCutPercentage?: number;
  /** Minimum scene duration in seconds */
  minSceneDuration?: number;
  /** Maximum scene duration in seconds */
  maxSceneDuration?: number;
  /** Whether to prioritize scene boundaries over exact beat timing */
  prioritizeSceneBoundaries?: boolean;
  /** Energy threshold for determining transition types (0-1) */
  energyThreshold?: {
    low: number;
    medium: number;
    high: number;
  };
  /** Framerate for the output sequence */
  framerate?: number;
}

/**
 * Interface representing edit decision engine options
 */
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

/**
 * Events emitted by the EditDecisionEngine
 */
export enum EditDecisionEngineEvents {
  PROGRESS = 'progress',
  COMPLETE = 'complete',
  ERROR = 'error',
  EDIT_ADDED = 'editAdded',
  EDIT_REMOVED = 'editRemoved',
  EDIT_UPDATED = 'editUpdated'
}

/**
 * Result of the edit decision generation process
 */
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

/**
 * Represents a point on the timeline for visualization
 */
export interface TimelinePoint {
  /** Time in seconds */
  time: number;
  /** Type of point */
  type: 'beat' | 'scene' | 'cut';
  /** Source video ID for scene and cut points */
  sourceId?: string;
  /** Energy level at this point (0-1) */
  energy?: number;
}

/**
 * Default export for backward compatibility
 */
export default EditDecision;
