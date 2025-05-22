
/**
 * application.types.ts
 * 
 * Central definitions for application-level types used throughout the application.
 * These types define the overall application state and structure.
 */

import { ProjectState, ProjectSettings } from './project.types';
import { UIState } from './ui.types';
import { AudioAnalysis } from './audio.types';
import { VideoAnalysis } from './video.types';
import { EditDecisionList, EditDecision } from './edit.types';

/**
 * Represents the status of a file being processed
 */
export enum ProcessingStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Represents a file uploaded to the application
 */
export interface UploadedFile {
  /** Unique identifier for the file */
  id: string;
  /** Original filename */
  name: string;
  /** File type (e.g., 'video/mp4', 'audio/wav') */
  type: string;
  /** File size in bytes */
  size: number;
  /** URL to access the file (could be blob URL or server path) */
  url: string;
  /** When the file was uploaded */
  uploadedAt: Date;
  /** Current processing status of the file */
  status: ProcessingStatus;
  /** Optional error message if processing failed */
  error?: string;
  /** Duration of the media file in seconds (if applicable) */
  duration?: number;
}

/**
 * Represents the state of all uploaded files
 */
export interface UploadedFilesState {
  /** Map of file IDs to their data */
  files: Record<string, UploadedFile>;
  /** IDs of video files */
  videoFiles: string[];
  /** IDs of audio files */
  audioFiles: string[];
  /** ID of the currently selected file */
  selectedFileId: string | null;
}

/**
 * Represents a clip on the timeline
 */
export interface TimelineClip {
  /** Unique identifier for the clip */
  id: string;
  /** Reference to the source file ID */
  fileId: string;
  /** Start time in the source file (seconds) */
  sourceStart: number;
  /** End time in the source file (seconds) */
  sourceEnd: number;
  /** Start time on the timeline (seconds) */
  timelineStart: number;
  /** Custom label for the clip */
  label?: string;
  /** Whether the clip is currently selected */
  selected: boolean;
}

/**
 * Represents the state of the timeline
 */
export interface TimelineState {
  /** All clips on the timeline */
  clips: TimelineClip[];
  /** Current playhead position in seconds */
  currentTime: number;
  /** Total duration of the timeline in seconds */
  duration: number;
  /** Timeline zoom level (1.0 = normal) */
  zoomLevel: number;
  /** Whether the timeline is currently playing */
  isPlaying: boolean;
  /** Current in-point for selection/editing */
  inPoint: number | null;
  /** Current out-point for selection/editing */
  outPoint: number | null;
}

/**
 * Represents the different workflow steps in the application
 */
export enum WorkflowStep {
  UPLOAD = 'upload',
  ANALYZE = 'analyze',
  EDIT = 'edit',
  EXPORT = 'export'
}

/**
 * Represents a processing task history entry
 */
export interface ProcessingHistoryEntry {
  /** Unique identifier for the processing task */
  id: string;
  /** Type of processing task */
  type: 'audio-analysis' | 'video-analysis' | 'export';
  /** When the task started */
  startedAt: Date;
  /** When the task completed (if it has) */
  completedAt?: Date;
  /** Current status of the task */
  status: ProcessingStatus;
  /** File ID associated with this task */
  fileId: string;
  /** Optional error message if the task failed */
  error?: string;
  /** Optional result data from the task */
  result?: any;
}

/**
 * Represents the processing state of the application
 */
export interface ProcessingState {
  /** Current active processing tasks */
  activeTasks: Record<string, ProcessingHistoryEntry>;
  /** History of completed processing tasks */
  history: ProcessingHistoryEntry[];
  /** Audio analysis results by file ID */
  audioAnalysisResults: Record<string, AudioAnalysis>;
  /** Video analysis results by file ID */
  videoAnalysisResults: Record<string, VideoAnalysis>;
  /** Current edit decision list */
  currentEDL: EditDecisionList | null;
}

/**
 * Represents the analysis state in the application
 */
export interface AnalysisState {
  /** Audio analysis results */
  audio: AudioAnalysis | null;
  /** Video analysis results */
  video: any | null;
  /** Whether analysis is currently in progress */
  isAnalyzing: boolean;
}

/**
 * Represents the edit state in the application
 */
export interface EditState {
  /** Edit decisions */
  decisions: EditDecision[];
  /** Currently selected edit */
  currentEdit: EditDecision | null;
  /** Index of the selected edit */
  selectedEditIndex: number | null;
}

/**
 * Represents the export state in the application
 */
export interface ExportState {
  /** Export settings */
  settings: {
    /** Export format */
    format: string;
    /** Whether to include audio */
    includeAudio: boolean;
    /** Whether to include markers */
    includeMarkers: boolean;
    /** Whether to generate notes */
    generateNotes: boolean;
    /** Output path */
    outputPath: string;
  };
  /** Whether to show the export modal */
  showExportModal: boolean;
  /** Export progress (0-100) */
  exportProgress: number;
  /** Whether export is complete */
  exportComplete: boolean;
  /** Export error message */
  exportError: string | null;
}

/**
 * Represents the complete application state
 */
export interface ApplicationState {
  /** State of uploaded files */
  uploadedFiles: UploadedFilesState;
  /** State of the timeline */
  timeline: TimelineState;
  /** Project settings */
  projectSettings: ProjectSettings;
  /** UI state */
  ui: UIState;
  /** Processing state */
  processing: ProcessingState;
  /** Whether the application has been initialized */
  initialized: boolean;
  /** Application version */
  version: string;
}

/**
 * Represents the complete application state (alternative structure)
 */
export interface AppState {
  /** Workflow state */
  workflow: WorkflowState;
  /** Project state */
  project: ProjectState;
  /** Analysis state */
  analysis: AnalysisState;
  /** Edit state */
  edit: EditState;
  /** Export state */
  export: ExportState;
  /** UI state */
  ui: UIState;
}

/**
 * Represents the workflow context type
 */
export interface WorkflowContextType {
  /** Application state */
  state: AppState;
  /** Current workflow step */
  currentStep: string;
  /** Function to navigate to a specific step */
  goToStep: (step: string) => void;
  /** Additional data */
  data: any;
  /** Function to set data */
  setData: (data: any) => void;
  /** Navigation functions */
  navigation: {
    /** Function to go to the next step */
    goToNextStep: () => void;
    /** Function to go to the previous step */
    goToPreviousStep: () => void;
    /** Function to go to a specific step */
    goToStep: (step: string) => void;
  };
  /** Action functions */
  actions: {
    /** Function to update project settings */
    updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
    /** Function to set the music file */
    setMusicFile: (file: File | null) => Promise<void>;
    /** Function to add a video file */
    addVideoFile: (file: File) => void;
    /** Function to remove a video file */
    removeVideoFile: (index: number) => void;
    /** Function to add a raw video file */
    addRawVideoFile: (file: File) => void;
    /** Function to remove a raw video file */
    removeRawVideoFile: (index: number) => void;
    /** Function to start analysis */
    startAnalysis: () => Promise<void>;
  };
}
