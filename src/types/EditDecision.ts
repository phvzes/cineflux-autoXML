/**
 * EditDecision.ts
 * 
 * This file defines TypeScript interfaces for edit decision lists (EDLs),
 * timeline cut points, matched clips, transitions, and audio/video alignment logic.
 * These interfaces provide a structured way to represent editing decisions
 * for automated video editing and XML generation.
 */

import { AudioAnalysisResult } from './AudioAnalysis';
import { VideoAnalysisResult } from './VideoAnalysis';

/**
 * Represents a timecode in the format HH:MM:SS:FF or as frame count
 */
export type Timecode = string | number;

/**
 * Enum defining different marker types for timeline points
 */
export enum MarkerType {
  IN = 'in',
  OUT = 'out',
  MARKER = 'marker',
  CHAPTER = 'chapter',
  COMMENT = 'comment',
  SYNC = 'sync'
}

/**
 * Represents a single point on the timeline, such as an in point, out point, or marker
 */
export interface TimelineCutPoint {
  /** Unique identifier for the cut point */
  id: string;
  
  /** Type of marker (in, out, marker, etc.) */
  type: MarkerType;
  
  /** Position on the timeline (timecode or frame number) */
  position: Timecode;
  
  /** Optional descriptive label for the cut point */
  label?: string;
  
  /** Optional color coding for visual identification */
  color?: string;
  
  /** Optional metadata for additional information */
  metadata?: Record<string, any>;
  
  /** Optional confidence score (0-1) if determined algorithmically */
  confidence?: number;
}

/**
 * Enum defining different track types
 */
export enum TrackType {
  VIDEO = 'video',
  AUDIO = 'audio',
  SUBTITLE = 'subtitle',
  GRAPHICS = 'graphics'
}

/**
 * Represents a clip that has been matched from source media to a position on the timeline
 */
export interface MatchedClip {
  /** Unique identifier for the matched clip */
  id: string;
  
  /** Reference to the source media file or clip ID */
  sourceId: string;
  
  /** Type of track this clip belongs to */
  trackType: TrackType;
  
  /** Track number (1-based index) */
  trackNumber: number;
  
  /** Start position on the timeline */
  timelineInPoint: Timecode;
  
  /** End position on the timeline */
  timelineOutPoint: Timecode;
  
  /** Start position in the source media */
  sourceInPoint: Timecode;
  
  /** End position in the source media */
  sourceOutPoint: Timecode;
  
  /** Optional speed/time remapping factor (1.0 = normal speed) */
  speed?: number;
  
  /** Optional rating or priority of this clip (useful for algorithmic decisions) */
  rating?: number;
  
  /** Optional flag indicating if this clip is enabled/disabled */
  enabled?: boolean;
  
  /** Optional metadata for additional information */
  metadata?: Record<string, any>;
  
  /** Optional reference to analysis results that informed this match */
  analysisReference?: {
    audio?: string | AudioAnalysisResult;
    video?: string | VideoAnalysisResult;
  };
}

/**
 * Enum defining different transition types
 */
export enum TransitionType {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE_IN = 'fade_in',
  FADE_OUT = 'fade_out',
  WIPE = 'wipe',
  DIP_TO_BLACK = 'dip_to_black',
  DIP_TO_WHITE = 'dip_to_white',
  CUSTOM = 'custom'
}

/**
 * Represents a transition between two clips on the timeline
 */
export interface Transition {
  /** Unique identifier for the transition */
  id: string;
  
  /** Type of transition */
  type: TransitionType;
  
  /** Duration of the transition in frames or timecode */
  duration: Timecode;
  
  /** ID of the outgoing clip */
  outgoingClipId: string;
  
  /** ID of the incoming clip */
  incomingClipId: string;
  
  /** Center point of the transition on the timeline */
  centerPoint: Timecode;
  
  /** Optional custom name for the transition */
  name?: string;
  
  /** Optional parameters specific to the transition type */
  parameters?: {
    /** Easing function for the transition (e.g., "linear", "ease-in", "ease-out") */
    easing?: string;
    
    /** Direction for directional transitions like wipes */
    direction?: string;
    
    /** Pattern for pattern-based transitions */
    pattern?: string;
    
    /** Border width for transitions with borders */
    borderWidth?: number;
    
    /** Border color for transitions with borders */
    borderColor?: string;
    
    /** Any additional custom parameters */
    [key: string]: any;
  };
}

/**
 * Represents a sync point between audio and video
 */
export interface SyncPoint {
  /** Unique identifier for the sync point */
  id: string;
  
  /** Position in the audio timeline */
  audioPosition: Timecode;
  
  /** Position in the video timeline */
  videoPosition: Timecode;
  
  /** Optional label for the sync point */
  label?: string;
  
  /** Optional confidence score (0-1) if determined algorithmically */
  confidence?: number;
}

/**
 * Represents alignment information between audio and video
 */
export interface AlignmentInfo {
  /** Collection of sync points between audio and video */
  syncPoints: SyncPoint[];
  
  /** Global offset between audio and video (positive means audio leads) */
  globalOffset: number;
  
  /** Whether to maintain sync by stretching/compressing audio */
  maintainSyncByTimeStretch?: boolean;
  
  /** Whether to maintain sync by inserting/removing frames */
  maintainSyncByFrameAdjustment?: boolean;
  
  /** Maximum allowable drift before correction (in frames or milliseconds) */
  maxAllowableDrift?: number;
  
  /** Optional metadata for additional information */
  metadata?: Record<string, any>;
}

/**
 * Enum defining different EDL formats
 */
export enum EDLFormat {
  CMX3600 = 'cmx3600',
  SONY9100 = 'sony9100',
  FCPXML = 'fcpxml',
  PREMIEREXML = 'premierexml',
  DAVINCIRESOLVE = 'davinciresolve',
  CUSTOM = 'custom'
}

/**
 * Represents a complete Edit Decision List (EDL)
 */
export interface EditDecisionList {
  /** Unique identifier for the EDL */
  id: string;
  
  /** Name of the EDL */
  name: string;
  
  /** Format of the EDL */
  format: EDLFormat;
  
  /** Project framerate (e.g., 24, 25, 29.97, 30, 60) */
  framerate: number;
  
  /** Collection of timeline cut points */
  cutPoints: TimelineCutPoint[];
  
  /** Collection of matched clips */
  clips: MatchedClip[];
  
  /** Collection of transitions */
  transitions: Transition[];
  
  /** Audio/video alignment information */
  alignment?: AlignmentInfo;
  
  /** Total duration of the sequence */
  totalDuration: Timecode;
  
  /** Creation date of the EDL */
  createdAt: Date | string;
  
  /** Last modified date of the EDL */
  modifiedAt: Date | string;
  
  /** Optional author of the EDL */
  author?: string;
  
  /** Optional notes about the EDL */
  notes?: string;
  
  /** Optional metadata for additional information */
  metadata?: Record<string, any>;
  
  /**
   * Validates the EDL for consistency and completeness
   * @returns Boolean indicating if the EDL is valid
   */
  validate?: () => boolean;
  
  /**
   * Exports the EDL to a specific format
   * @param format The format to export to
   * @returns String representation of the EDL in the specified format
   */
  export?: (format: EDLFormat) => string;
}

/**
 * Factory function to create a new empty Edit Decision List
 */
export function createEmptyEDL(name: string, framerate: number): EditDecisionList {
  return {
    id: `edl_${Date.now()}`,
    name,
    format: EDLFormat.CUSTOM,
    framerate,
    cutPoints: [],
    clips: [],
    transitions: [],
    totalDuration: 0,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };
}
