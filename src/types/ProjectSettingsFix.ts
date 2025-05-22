/**
 * ProjectSettingsFix.ts
 * 
 * This file provides a direct export of the ProjectSettings interface
 * to fix import issues in the application.
 */

// Define all types directly here to avoid circular dependencies
import { 
  ProjectSettings as OriginalProjectSettings,
  DEFAULT_PROJECT_SETTINGS,
  AudioSyncMethod,
  AudioSyncSettings,
  ClipLengthConstraints,
  EditingMode,
  EditingModeSettings,
  VideoCodec,
  AudioCodec,
  VideoResolution,
  ExportFormatSettings,
  TransitionType,
  ColorGradingPreset,
  ProjectPreferences
} from './ProjectSettings';

// Re-define types to avoid import issues
export interface AudioSyncSettingsFix {
  enabled: boolean;
  method: AudioSyncMethod;
  confidenceThreshold: number;
  maxTimeOffset: number;
  driftCompensation: boolean;
  prioritizeSync: boolean;
  applyNoiseReduction: boolean;
  useReferenceTrack: boolean;
  referenceTrackId?: string;
}

export interface ClipLengthConstraintsFix {
  minDuration: number;
  maxDuration: number;
  targetDuration: number;
  enforceHardLimits: boolean;
  dynamicAdjustment: boolean;
  minTransitionDuration: number;
  maxTransitionDuration: number;
  preservePhrases: boolean;
}

export interface EditingModeSettingsFix {
  mode: EditingMode;
  pacingFactor: number;
  prioritizeVisualQuality: boolean;
  prioritizeAudioQuality: boolean;
  maintainChronology: boolean;
  useB_Roll: boolean;
  cutOnAction: boolean;
  cutOnAudioCues: boolean;
  customParameters?: Record<string, any>;
}

export interface ExportFormatSettingsFix {
  resolution: VideoResolution;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  videoBitrate: number;
  audioBitrate: number;
  frameRate: number;
  quality: number;
  useCRF: boolean;
  crfValue?: number;
  useHardwareAcceleration: boolean;
  fileFormat: 'mp4' | 'mov' | 'mkv' | 'webm' | 'avi';
  includeChapters: boolean;
  embedMetadata: boolean;
  optimizeForWeb: boolean;
}

// Re-export the interface and all related types
export type ProjectSettings = OriginalProjectSettings;
export {
  DEFAULT_PROJECT_SETTINGS,
  AudioSyncMethod,
  EditingMode,
  VideoCodec,
  AudioCodec,
  VideoResolution,
  TransitionType,
  ColorGradingPreset,
  ProjectPreferences
};

// Export our fixed types
export type AudioSyncSettings = AudioSyncSettingsFix;
export type ClipLengthConstraints = ClipLengthConstraintsFix;
export type EditingModeSettings = EditingModeSettingsFix;
export type ExportFormatSettings = ExportFormatSettingsFix;

// Export a simplified version for quick use
export interface SimpleProjectSettings {
  projectName: string;
  genre?: string;
  style?: string;
  transitions?: string;
  exportFormat?: {
    resolution: string;
    videoCodec: string;
    audioCodec: string;
    videoBitrate: number;
    audioBitrate: number;
    frameRate: number;
    quality: number;
    useCRF: boolean;
    crfValue?: number;
    useHardwareAcceleration: boolean;
    fileFormat: string;
    includeChapters: boolean;
    embedMetadata: boolean;
    optimizeForWeb: boolean;
  };
}
