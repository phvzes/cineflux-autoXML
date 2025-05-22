/**
 * ProjectSettingsFix.ts
 * 
 * This file provides a direct export of the ProjectSettings interface
 * to fix import issues in the application.
 */

// Import only the enums and constants we need, not the interfaces we're redefining
import { 
  DEFAULT_PROJECT_SETTINGS,
  AudioSyncMethod,
  EditingMode,
  VideoCodec,
  AudioCodec,
  VideoResolution,
  TransitionType,
  ColorGradingPreset
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

// Define ProjectPreferences directly to avoid circular dependencies
export interface ProjectPreferencesFix {
  /** Default transition type between clips */
  defaultTransition: TransitionType;
  /** Duration of the default transition in seconds */
  defaultTransitionDuration: number;
  /** Whether to automatically add transitions between clips */
  autoAddTransitions: boolean;
  /** Color grading preset to apply to the project */
  colorGradingPreset: ColorGradingPreset;
  /** Custom color grading LUT file path if using CUSTOM preset */
  customLUTPath?: string;
  /** Whether to automatically normalize audio levels */
  normalizeAudio: boolean;
  /** Target audio level in dB for normalization */
  targetAudioLevel: number;
  /** Whether to automatically add background music */
  addBackgroundMusic: boolean;
  /** Path to background music file if addBackgroundMusic is true */
  backgroundMusicPath?: string;
  /** Volume level for background music (0.0-1.0) */
  backgroundMusicVolume: number;
  /** Whether to automatically generate titles */
  autoGenerateTitles: boolean;
  /** Title template for auto-generated titles */
  titleTemplate?: string;
  /** Whether to add watermark to the output */
  addWatermark: boolean;
  /** Path to watermark image if addWatermark is true */
  watermarkPath?: string;
  /** Opacity of watermark (0.0-1.0) */
  watermarkOpacity: number;
  /** Position of watermark */
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

// Define the main ProjectSettings interface
export interface ProjectSettingsFix {
  /** Project name */
  projectName: string;
  /** Project description */
  projectDescription?: string;
  /** Audio synchronization settings */
  audioSync: AudioSyncSettingsFix;
  /** Clip length constraints */
  clipLength: ClipLengthConstraintsFix;
  /** Editing mode settings */
  editingMode: EditingModeSettingsFix;
  /** Export format settings */
  exportFormat: ExportFormatSettingsFix;
  /** Project preferences */
  preferences: ProjectPreferencesFix;
  /** Date when the project was created */
  createdAt: Date;
  /** Date when the project was last modified */
  lastModifiedAt: Date;
  /** User ID of the project owner */
  ownerId: string;
  /** Whether the project is marked as a template */
  isTemplate: boolean;
  /** Tags associated with the project */
  tags: string[];
  /** Custom user-defined settings including export format type */
  customSettings?: { exportFormatType?: string } & Record<string, any>;
  /** Music genre for the project */
  genre?: string;
  /** Editing style preference */
  style?: string;
  /** Transition preference */
  transitions?: string;
}

// Export the constants
export { DEFAULT_PROJECT_SETTINGS };

// Export the enums
export {
  AudioSyncMethod,
  EditingMode,
  VideoCodec,
  AudioCodec,
  VideoResolution,
  TransitionType,
  ColorGradingPreset
};

// Export our fixed types
export type AudioSyncSettings = AudioSyncSettingsFix;
export type ClipLengthConstraints = ClipLengthConstraintsFix;
export type EditingModeSettings = EditingModeSettingsFix;
export type ExportFormatSettings = ExportFormatSettingsFix;
export type ProjectPreferences = ProjectPreferencesFix;
export type ProjectSettings = ProjectSettingsFix;

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
