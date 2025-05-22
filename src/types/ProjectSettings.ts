/**
 * ProjectSettings.ts
 * 
 * This file defines TypeScript interfaces for user-controlled project settings
 * in the CineFlux application. These settings control various aspects of the
 * automated video editing process including audio synchronization, clip length
 * constraints, editing modes, export formats, and general project preferences.
 */

/**
 * Defines the available audio synchronization methods
 */
export enum AudioSyncMethod {
  /** Uses waveform peak alignment for synchronization */
  WAVEFORM_PEAK = 'waveform_peak',
  /** Uses spectral fingerprinting for synchronization */
  SPECTRAL_FINGERPRINT = 'spectral_fingerprint',
  /** Uses onset detection for synchronization */
  ONSET_DETECTION = 'onset_detection',
  /** Uses machine learning based audio matching */
  ML_AUDIO_MATCH = 'ml_audio_match'
}

/**
 * Settings related to audio synchronization between multiple sources
 */
export interface AudioSyncSettings {
  /** Whether audio synchronization is enabled */
  enabled: boolean;
  /** The method used for audio synchronization */
  method: AudioSyncMethod;
  /** Confidence threshold (0.0-1.0) for accepting a sync match */
  confidenceThreshold: number;
  /** Maximum time offset (in milliseconds) to search for sync points */
  maxTimeOffset: number;
  /** Whether to automatically adjust for drift over time */
  driftCompensation: boolean;
  /** Whether to prioritize maintaining sync over other editing decisions */
  prioritizeSync: boolean;
  /** Whether to apply noise reduction before sync detection */
  applyNoiseReduction: boolean;
  /** Whether to use reference audio track for multi-camera sync */
  useReferenceTrack: boolean;
  /** ID of the reference audio track if useReferenceTrack is true */
  referenceTrackId?: string;
}

/**
 * Defines the constraints for clip durations in the edited output
 */
export interface ClipLengthConstraints {
  /** Minimum allowed duration for any clip in seconds */
  minDuration: number;
  /** Maximum allowed duration for any clip in seconds */
  maxDuration: number;
  /** Target optimal duration for clips in seconds */
  targetDuration: number;
  /** Whether to enforce hard limits on clip durations */
  enforceHardLimits: boolean;
  /** Whether to dynamically adjust clip lengths based on content */
  dynamicAdjustment: boolean;
  /** Minimum duration for transition clips in seconds */
  minTransitionDuration: number;
  /** Maximum duration for transition clips in seconds */
  maxTransitionDuration: number;
  /** Whether to preserve complete sentences/phrases when cutting */
  preservePhrases: boolean;
}

/**
 * Available editing modes that determine the overall editing style
 */
export enum EditingMode {
  /** Focuses on minimal cuts, longer takes */
  MINIMAL = 'minimal',
  /** Standard editing with balanced pacing */
  STANDARD = 'standard',
  /** Dynamic editing with frequent cuts and high energy */
  DYNAMIC = 'dynamic',
  /** Cinematic style with artistic composition priority */
  CINEMATIC = 'cinematic',
  /** Documentary style focusing on content over style */
  DOCUMENTARY = 'documentary',
  /** Custom user-defined editing style */
  CUSTOM = 'custom'
}

/**
 * Settings that control the overall editing approach
 */
export interface EditingModeSettings {
  /** The selected editing mode */
  mode: EditingMode;
  /** Pacing factor (0.0-2.0) where 1.0 is normal, lower is slower, higher is faster */
  pacingFactor: number;
  /** Whether to prioritize visual quality over other factors */
  prioritizeVisualQuality: boolean;
  /** Whether to prioritize audio quality over other factors */
  prioritizeAudioQuality: boolean;
  /** Whether to maintain chronological order of events */
  maintainChronology: boolean;
  /** Whether to use B-roll footage automatically */
  useB_Roll: boolean;
  /** Whether to cut on action/movement */
  cutOnAction: boolean;
  /** Whether to cut on audio cues */
  cutOnAudioCues: boolean;
  /** Custom parameters for CUSTOM mode */
  customParameters?: Record<string, any>;
}

/**
 * Available video codecs for export
 */
export enum VideoCodec {
  H264 = 'h264',
  H265 = 'h265',
  VP9 = 'vp9',
  AV1 = 'av1',
  PRORES = 'prores',
  DNxHD = 'dnxhd'
}

/**
 * Available audio codecs for export
 */
export enum AudioCodec {
  AAC = 'aac',
  MP3 = 'mp3',
  FLAC = 'flac',
  PCM = 'pcm',
  OPUS = 'opus'
}

/**
 * Standard video resolutions
 */
export enum VideoResolution {
  SD_480P = '854x480',
  HD_720P = '1280x720',
  FULL_HD_1080P = '1920x1080',
  QHD_1440P = '2560x1440',
  UHD_4K = '3840x2160',
  DCI_4K = '4096x2160',
  UHD_8K = '7680x4320'
}

/**
 * Settings for export format configuration
 */
export interface ExportFormatSettings {
  /** The output video resolution */
  resolution: VideoResolution;
  /** The video codec to use for export */
  videoCodec: VideoCodec;
  /** The audio codec to use for export */
  audioCodec: AudioCodec;
  /** Video bitrate in Mbps */
  videoBitrate: number;
  /** Audio bitrate in kbps */
  audioBitrate: number;
  /** Frame rate in frames per second */
  frameRate: number;
  /** Quality setting (0-100) where applicable */
  quality: number;
  /** Whether to use constant rate factor (CRF) encoding */
  useCRF: boolean;
  /** CRF value (0-51, lower is higher quality) if useCRF is true */
  crfValue?: number;
  /** Whether to use hardware acceleration for encoding */
  useHardwareAcceleration: boolean;
  /** Output file format extension */
  fileFormat: 'mp4' | 'mov' | 'mkv' | 'webm' | 'avi';
  /** Whether to include chapter markers */
  includeChapters: boolean;
  /** Whether to embed metadata in the output file */
  embedMetadata: boolean;
  /** Whether to optimize for web streaming */
  optimizeForWeb: boolean;
}

/**
 * Available transition types
 */
export enum TransitionType {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE = 'fade',
  WIPE = 'wipe',
  ZOOM = 'zoom',
  SLIDE = 'slide',
  CUSTOM = 'custom'
}

/**
 * Color grading presets
 */
export enum ColorGradingPreset {
  NONE = 'none',
  CINEMATIC = 'cinematic',
  WARM = 'warm',
  COOL = 'cool',
  VINTAGE = 'vintage',
  MONOCHROME = 'monochrome',
  HIGH_CONTRAST = 'high_contrast',
  CUSTOM = 'custom'
}

/**
 * General project preferences
 */
export interface ProjectPreferences {
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

/**
 * Main interface that combines all project settings
 */
export interface ProjectSettings {
  /** Project name */
  projectName: string;
  /** Project description */
  projectDescription?: string;
  /** Audio synchronization settings */
  audioSync: AudioSyncSettings;
  /** Clip length constraints */
  clipLength: ClipLengthConstraints;
  /** Editing mode settings */
  editingMode: EditingModeSettings;
  /** Export format settings */
  exportFormat: ExportFormatSettings;
  /** Project preferences */
  preferences: ProjectPreferences;
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

/**
 * Default project settings that can be used as a starting point
 */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  projectName: 'New Project',
  projectDescription: '',
  audioSync: {
    enabled: true,
    method: AudioSyncMethod.WAVEFORM_PEAK,
    confidenceThreshold: 0.8,
    maxTimeOffset: 5000,
    driftCompensation: true,
    prioritizeSync: true,
    applyNoiseReduction: true,
    useReferenceTrack: false
  },
  clipLength: {
    minDuration: 1.5,
    maxDuration: 10.0,
    targetDuration: 4.0,
    enforceHardLimits: true,
    dynamicAdjustment: true,
    minTransitionDuration: 0.5,
    maxTransitionDuration: 2.0,
    preservePhrases: true
  },
  editingMode: {
    mode: EditingMode.STANDARD,
    pacingFactor: 1.0,
    prioritizeVisualQuality: true,
    prioritizeAudioQuality: true,
    maintainChronology: true,
    useB_Roll: true,
    cutOnAction: true,
    cutOnAudioCues: true
  },
  exportFormat: {
    resolution: VideoResolution.FULL_HD_1080P,
    videoCodec: VideoCodec.H264,
    audioCodec: AudioCodec.AAC,
    videoBitrate: 8,
    audioBitrate: 192,
    frameRate: 30,
    quality: 85,
    useCRF: true,
    crfValue: 23,
    useHardwareAcceleration: true,
    fileFormat: 'mp4',
    includeChapters: false,
    embedMetadata: true,
    optimizeForWeb: true
  },
  preferences: {
    defaultTransition: TransitionType.DISSOLVE,
    defaultTransitionDuration: 0.75,
    autoAddTransitions: true,
    colorGradingPreset: ColorGradingPreset.NONE,
    normalizeAudio: true,
    targetAudioLevel: -14,
    addBackgroundMusic: false,
    backgroundMusicVolume: 0.2,
    autoGenerateTitles: false,
    addWatermark: false,
    watermarkOpacity: 0.7,
    watermarkPosition: 'bottom-right'
  },
  createdAt: new Date(),
  lastModifiedAt: new Date(),
  ownerId: '',
  isTemplate: false,
  tags: []
};

// Add default export
export default ProjectSettings;
