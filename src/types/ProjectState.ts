/**
 * ProjectState.ts
 * 
 * This file defines the types related to project state in the application.
 */

import { VideoFile } from './FileTypes';

/**
 * Project settings interface
 */
export interface ProjectSettings {
  /** Music genre for the project */
  genre: string;
  /** Editing style */
  style: string;
  /** Transition preference */
  transitions: string;
  /** Export format */
  exportFormat: string;
}

/**
 * Raw video file interface
 */
export interface RawVideoFile {
  /** The file object */
  file: File;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** File MIME type */
  type: string;
  /** Object URL for the file */
  url: string;
}

/**
 * Project state interface
 */
export interface ProjectState {
  /** Project settings */
  settings: ProjectSettings;
  /** Music file for the project */
  musicFile: { file: File; duration: number } | null;
  /** Video files for the project */
  videoFiles: VideoFile[];
  /** Raw video files for the project */
  rawVideoFiles: RawVideoFile[];
  /** Current step in the workflow */
  currentStep: string;
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Audio analysis results */
  audioAnalysis: any | null;
  /** Video analysis results */
  videoAnalyses: Record<string, any>;
  /** Edit decisions */
  editDecisions: any[];
  /** Whether the export modal is shown */
  showExportModal: boolean;
  /** Total duration of the project */
  duration: number;
}

export default ProjectState;
