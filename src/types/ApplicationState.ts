import { AudioAnalysisResult } from './AudioAnalysis';
import { VideoAnalysisResult } from './VideoAnalysis';
import { EditDecisionList } from './EditDecision';
import { ProjectSettings } from './ProjectSettings';

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
 * @interface UploadedFile
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
 * @interface UploadedFilesState
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
 * @interface TimelineClip
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
 * @interface TimelineState
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
 * Represents the types of modals that can be shown
 */
export enum ModalType {
  NONE = 'none',
  SETTINGS = 'settings',
  EXPORT = 'export',
  FILE_DETAILS = 'file-details',
  ERROR = 'error',
  HELP = 'help'
}

/**
 * Represents the UI state of the application
 * @interface UIState
 */
export interface UIState {
  /** Current active workflow step */
  activeWorkflowStep: WorkflowStep;
  /** Currently active modal */
  activeModal: ModalType;
  /** Whether the sidebar is expanded */
  sidebarExpanded: boolean;
  /** Whether dark mode is enabled */
  darkMode: boolean;
  /** Whether the application is in a loading state */
  isLoading: boolean;
  /** Global notification message */
  notification: {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    visible: boolean;
  };
}

/**
 * Represents a processing task history entry
 * @interface ProcessingHistoryEntry
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
 * @interface ProcessingState
 */
export interface ProcessingState {
  /** Current active processing tasks */
  activeTasks: Record<string, ProcessingHistoryEntry>;
  /** History of completed processing tasks */
  history: ProcessingHistoryEntry[];
  /** Audio analysis results by file ID */
  audioAnalysisResults: Record<string, AudioAnalysisResult>;
  /** Video analysis results by file ID */
  videoAnalysisResults: Record<string, VideoAnalysisResult>;
  /** Current edit decision list */
  currentEDL: EditDecisionList | null;
}

/**
 * Represents the root application state
 * @interface ApplicationState
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
