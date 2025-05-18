/**
 * EditDecision.ts
 * 
 * This file defines the EditDecision type for the workflow.
 */
import TransitionType from './TransitionType';
import { Scene } from '../video-types';

/**
 * Represents a transition between two clips
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
 * Represents an edit decision in the workflow
 */
interface EditDecision {
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

export default EditDecision;
