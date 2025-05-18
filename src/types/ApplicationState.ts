/**
 * ApplicationState.ts
 * 
 * This file defines the application state types.
 */
import { AudioAnalysis } from './audio-types';
import { VideoAnalysis } from './video-types';
import { EditDecisionList } from './edit-types';
import { ProjectState } from './ProjectState';

/**
 * Enum for different application steps
 */
export enum ApplicationStep {
  WELCOME = 'welcome',
  INPUT = 'input',
  ANALYZING = 'analyzing',
  EDITING = 'editing',
  PREVIEW = 'preview',
  EXPORT = 'export'
}

/**
 * Enum for different workflow steps
 */
export enum WorkflowStep {
  WELCOME = 'welcome',
  INPUT = 'input',
  ANALYSIS = 'analysis',
  EDITING = 'editing',
  PREVIEW = 'preview',
  EXPORT = 'export'
}

/**
 * Enum for different modal types
 */
export enum ModalType {
  NONE = 'none',
  SETTINGS = 'settings',
  EXPORT = 'export',
  HELP = 'help',
  ERROR = 'error',
  CONFIRM = 'confirm',
  CUSTOM = 'custom'
}

/**
 * Interface for UI state
 */
export interface UIState {
  /**
   * Current application step
   */
  currentStep: ApplicationStep;
  
  /**
   * Whether the application is in dark mode
   */
  darkMode: boolean;
  
  /**
   * Current active modal
   */
  activeModal: ModalType;
  
  /**
   * Whether the sidebar is open
   */
  sidebarOpen: boolean;
  
  /**
   * Whether the application is in fullscreen mode
   */
  fullscreen: boolean;
  
  /**
   * Whether the application is loading
   */
  isLoading: boolean;
  
  /**
   * Loading message to display
   */
  loadingMessage?: string;
  
  /**
   * Error message to display
   */
  errorMessage?: string;
  
  /**
   * Success message to display
   */
  successMessage?: string;
  
  /**
   * Error messages for different parts of the application
   */
  errors: {
    audioUpload?: string | null;
    videoUpload?: string | null;
    audioLoad?: string | null;
    analysis?: string | null;
    navigation?: string | null;
    [key: string]: string | null | undefined;
  };
  
  /**
   * Audio processing progress
   */
  audioProgress?: {
    percentage: number;
    currentStep: string;
  } | null;
  
  /**
   * Video processing progress
   */
  videoProgress?: {
    percentage: number;
    currentStep: string;
  } | null;
  
  /**
   * Raw video processing progress
   */
  rawVideoProgress?: {
    percentage: number;
    currentStep: string;
  } | null;
  
  /**
   * Modal states
   */
  modals?: {
    showSettings: boolean;
    showHelp: boolean;
    [key: string]: boolean;
  };
}

/**
 * Interface for analysis state
 */
export interface AnalysisState {
  /**
   * Whether analysis is in progress
   */
  isAnalyzing: boolean;
  
  /**
   * Progress of the analysis (0-100)
   */
  progress: number;
  
  /**
   * Current step of the analysis
   */
  currentStep: string;
  
  /**
   * Audio analysis result
   */
  audioAnalysis: AudioAnalysis | null;
  
  /**
   * Video analysis results
   */
  videoAnalyses: VideoAnalysis[];
  
  /**
   * Error that occurred during analysis
   */
  error?: Error;
  
  /**
   * Audio analysis data
   */
  audio: AudioAnalysis | null;
  
  /**
   * Video analysis data
   */
  video: VideoAnalysis[] | null;
}

/**
 * Interface for edit state
 */
export interface EditState {
  /**
   * Current edit decision list
   */
  editDecisionList: EditDecisionList | null;
  
  /**
   * Whether the edit is in progress
   */
  isEditing: boolean;
  
  /**
   * Selected edit decision index
   */
  selectedEditIndex: number | null;
  
  /**
   * Current playback time in the timeline
   */
  currentTime: number;
  
  /**
   * Whether the timeline is playing
   */
  isPlaying: boolean;
  
  /**
   * Zoom level of the timeline
   */
  zoomLevel: number;
  
  /**
   * Array of edit decisions
   */
  decisions: import('./edit-types').EditDecision[];
  
  /**
   * Currently selected edit decision
   */
  currentEdit: import('./edit-types').EditDecision | null;
}

/**
 * Interface for export state
 */
export interface ExportState {
  /**
   * Whether export is in progress
   */
  isExporting: boolean;
  
  /**
   * Progress of the export (0-100)
   */
  progress: number;
  
  /**
   * Format of the export
   */
  format: string;
  
  /**
   * Result of the export
   */
  result?: unknown;
  
  /**
   * Error that occurred during export
   */
  error?: Error;
  
  /**
   * Export settings
   */
  settings: {
    format: string;
    includeAudio: boolean;
    includeMarkers: boolean;
    generateNotes: boolean;
    outputPath: string;
    [key: string]: unknown;
  };
  
  /**
   * Whether to show the export modal
   */
  showExportModal: boolean;
  
  /**
   * Export progress (0-100)
   */
  exportProgress: number;
  
  /**
   * Whether export is complete
   */
  exportComplete: boolean;
  
  /**
   * Export error
   */
  exportError: Error | null;
}

/**
 * Interface for workflow state
 */
export interface WorkflowState {
  /**
   * Current step in the workflow
   */
  currentStep: WorkflowStep;
  
  /**
   * Analysis progress information
   */
  analysisProgress: {
    percentage: number;
    currentStep: string;
    isComplete: boolean;
  };
  
  /**
   * Whether the timeline is playing
   */
  isPlaying: boolean;
  
  /**
   * Current playback time
   */
  currentTime: number;
  
  /**
   * Total duration of the project
   */
  totalDuration: number;
}

/**
 * Interface for the complete application state
 */
export interface AppState {
  /**
   * UI state
   */
  ui: UIState;
  
  /**
   * Project state
   */
  project: ProjectState;
  
  /**
   * Analysis state
   */
  analysis: AnalysisState;
  
  /**
   * Edit state
   */
  edit: EditState;
  
  /**
   * Export state
   */
  export: ExportState;
  
  /**
   * Workflow state
   */
  workflow: WorkflowState;
}
