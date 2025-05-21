/**
 * workflow-types.ts
 * 
 * Central definitions for workflow-related types used throughout the application.
 */

import { VideoFile } from './video-types';
import { AudioAnalysis } from './audio-types';
import { ProjectSettings } from './ProjectSettings';
import { WorkflowStep } from './workflow/WorkflowStep';

/**
 * Represents an edit decision for the timeline
 */
export interface EditDecision {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  videoFileId?: string;
  sourceStartTime?: number;
  sourceEndTime?: number;
  transitionType?: string;
  transitionDuration?: number;
  notes?: string;
  tags?: string[];
  isSelected?: boolean;
}

/**
 * Represents the workflow state in the application
 */
export interface WorkflowState {
  currentStep: WorkflowStep;
  analysisProgress: {
    percentage: number;
    currentStep: string;
    isComplete: boolean;
  };
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
}

/**
 * Represents the project state in the application
 */
export interface ProjectState {
  settings: ProjectSettings;
  musicFile: File | null;
  videoFiles: VideoFile[];
  rawVideoFiles: VideoFile[];
}

/**
 * Represents the analysis state in the application
 */
export interface AnalysisState {
  audio: AudioAnalysis | null;
  video: any | null; // Using any temporarily, should be replaced with proper type
  isAnalyzing: boolean;
}

/**
 * Represents the edit state in the application
 */
export interface EditState {
  decisions: EditDecision[];
  currentEdit: EditDecision | null;
  selectedEditIndex: number | null;
}

/**
 * Represents the export state in the application
 */
export interface ExportState {
  settings: {
    format: string;
    includeAudio: boolean;
    includeMarkers: boolean;
    generateNotes: boolean;
    outputPath: string;
  };
  showExportModal: boolean;
  exportProgress: number;
  exportComplete: boolean;
  exportError: string | null;
}

/**
 * Represents the UI state in the application
 */
export interface UIState {
  errors: Record<string, string>;
  modals: {
    showSettings: boolean;
    showHelp: boolean;
  };
}

/**
 * Represents the complete application state
 */
export interface AppState {
  workflow: WorkflowState;
  project: ProjectState;
  analysis: AnalysisState;
  edit: EditState;
  export: ExportState;
  ui: UIState;
}

/**
 * Represents the context type for the workflow
 */
export interface WorkflowContextType {
  state: AppState;
  currentStep: WorkflowStep;
  goToStep: (step: WorkflowStep) => void;
  data: any; // Using any temporarily, should be replaced with proper type
  setData: (data: any) => void;
  navigation: {
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    goToStep: (step: WorkflowStep) => void;
  };
  actions: {
    updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
    setMusicFile: (file: File | null) => Promise<void>;
    addVideoFile: (file: File) => void;
    removeVideoFile: (index: number) => void;
    addRawVideoFile: (file: File) => void;
    removeRawVideoFile: (index: number) => void;
    startAnalysis: () => Promise<void>;
  };
}
