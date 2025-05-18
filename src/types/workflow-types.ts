/**
 * workflow-types.ts
 * 
 * This file re-exports all workflow-related types for easy access.
 */

// Import workflow-specific types
import { WorkflowStep } from './workflow/WorkflowStep';
import { EditDecision, Transition } from './edit-types';
import { TransitionType } from './edit-types';
import { AudioSegment, Beat } from './audio-types';

// Re-export workflow-specific types
export { WorkflowStep, EditDecision, Transition, TransitionType, AudioSegment, Beat };

/**
 * Interface representing a workflow state
 */
export interface WorkflowState {
  /** Current step in the workflow */
  currentStep: WorkflowStep;
  /** Previous step in the workflow */
  previousStep?: WorkflowStep;
  /** Whether the workflow is in progress */
  inProgress: boolean;
  /** Whether the workflow is complete */
  isComplete: boolean;
  /** Error message if any */
  error?: string;
}

/**
 * Interface representing workflow options
 */
export interface WorkflowOptions {
  /** Whether to auto-proceed to the next step */
  autoProceed?: boolean;
  /** Whether to skip certain steps */
  skipSteps?: WorkflowStep[];
  /** Custom parameters for the workflow */
  customParams?: Record<string, any>;
}

/**
 * Interface representing edit decision list
 */
export interface EditDecisionList {
  /** Unique identifier for this EDL */
  id: string;
  /** Name of the EDL */
  name: string;
  /** Array of edit decisions */
  decisions: EditDecision[];
  /** Total duration of the timeline in seconds */
  duration: number;
}

/**
 * Interface representing edit decision statistics
 */
export interface EditDecisionStats {
  /** Total number of edits */
  totalEdits: number;
  /** Average edit duration in seconds */
  averageEditDuration: number;
  /** Number of each transition type */
  transitionCounts: Record<TransitionType, number>;
  /** Total timeline duration in seconds */
  totalDuration: number;
}
