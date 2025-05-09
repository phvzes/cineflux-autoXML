/**
 * Workflow Types
 * 
 * This file contains type definitions for the workflow system.
 */

export enum WorkflowStep {
  INPUT = 'input',
  ANALYSIS = 'analysis',
  EDIT = 'edit',
  EXPORT = 'export'
}

export interface AnalysisProgress {
  percentage: number;
  currentStep: string;
  isComplete: boolean;
}

export interface WorkflowState {
  currentStep: WorkflowStep;
  analysisProgress: AnalysisProgress;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
}

export interface ProjectSettings {
  genre: string;
  style: string;
  transitions: string;
  exportFormat: string;
}

export interface VideoFile {
  file: File;
  name: string;
  size: number;
  duration: number;
  type: string;
  url: string;
}

export interface ProjectState {
  settings: ProjectSettings;
  musicFile: {
    file: File;
    duration: number;
  } | null;
  videoFiles: VideoFile[];
}

export interface AnalysisState {
  audio: any | null; // This would be replaced with a proper AudioAnalysis type
  video: any | null; // This would be replaced with a proper VideoAnalysis type
  isAnalyzing: boolean;
}

export interface EditDecision {
  id: string;
  startTime: number;
  endTime: number;
  videoFileIndex: number;
  videoStartTime: number;
  videoEndTime: number;
  type: 'cut' | 'transition';
}

export interface EditState {
  decisions: EditDecision[];
  currentEdit: EditDecision | null;
  selectedEditIndex: number | null;
}

export interface ExportSettings {
  format: 'premiere' | 'fcpxml' | 'davinci';
  includeAudio: boolean;
  includeMarkers: boolean;
  generateNotes: boolean;
  outputPath: string;
}

export interface ExportState {
  settings: ExportSettings;
  showExportModal: boolean;
  exportProgress: number;
  exportComplete: boolean;
  exportError: string | null;
}

export interface UIState {
  errors: Record<string, string>;
  modals: {
    showSettings: boolean;
    showHelp: boolean;
  };
}

export interface AppState {
  workflow: WorkflowState;
  project: ProjectState;
  analysis: AnalysisState;
  edit: EditState;
  export: ExportState;
  ui: UIState;
}
