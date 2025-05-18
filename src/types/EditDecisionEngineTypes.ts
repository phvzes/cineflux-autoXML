/**
 * EditDecisionEngineTypes.ts
 * 
 * This file defines TypeScript interfaces and types specifically for the EditDecisionEngine
 * to ensure proper typing throughout the algorithm functions that match video clips to music segments.
 */

import { TransitionType } from './edit-types';

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
 * Result of the edit decision generation process
 */
export interface EditDecisionResult {
  /** The generated Edit Decision List */
  edl: EditDecisionList;
  /** Timeline of cuts with beat and scene information */
  timeline: TimelinePoint[];
  /** Statistics about the generated edit */
  stats: EditDecisionStats;
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
 * Statistics about the generated edit
 */
export interface EditDecisionStats {
  /** Total number of cuts in the edit */
  totalCuts: number;
  /** Average duration of scenes in seconds */
  averageSceneDuration: number;
  /** Count of each transition type used */
  transitionTypes: Record<TransitionType, number>;
  /** Score representing how well cuts align with beats (0-1) */
  beatAlignmentScore: number;
}

/**
 * Represents a cut point in the timeline
 */
export interface CutPoint {
  /** Time in seconds */
  time: number;
  /** Type of point */
  type: 'cut';
  /** Source video ID */
  sourceId?: string;
  /** Start time of the scene in the source video */
  sceneStart?: number;
  /** Energy level at this point (0-1) */
  energy: number;
}

/**
 * Represents a timeline marker for visualization
 */
export interface TimelineMarker {
  /** Position on the timeline */
  position: number;
  /** Type of marker */
  type: string;
  /** Label for the marker */
  label: string;
}

/**
 * Video metadata stored by the engine
 */
export interface VideoMetadata {
  /** Duration in seconds */
  duration: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Frame rate */
  frameRate: number;
  /** Name or title */
  name: string;
}
