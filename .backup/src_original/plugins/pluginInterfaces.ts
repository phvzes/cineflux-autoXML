/**
 * CineFlux-AutoXML Plugin Interfaces
 * Defines the base plugin interface and specialized plugin interfaces
 */

import {
  PluginMetadata,
  PluginInitOptions,
  PluginProcessOptions,
  PluginResult
} from '../types/plugins';

/**
 * Base Plugin Interface
 * All plugins must implement this interface
 */
export interface BasePlugin {
  /**
   * Plugin metadata
   */
  readonly metadata: PluginMetadata;
  
  /**
   * Initialize the plugin with the provided options
   * @param options Initialization options
   */
  initialize(options?: PluginInitOptions): Promise<boolean>;
  
  /**
   * Process data with the plugin
   * @param options Processing options containing data and configuration
   */
  process(options: PluginProcessOptions): Promise<PluginResult>;
  
  /**
   * Get the current status of the plugin
   */
  getStatus(): Promise<Record<string, any>>;
  
  /**
   * Clean up resources used by the plugin
   */
  dispose(): Promise<void>;
}

/**
 * Audio Analysis Plugin Interface
 * Specialized for audio analysis functionality
 */
export interface AudioAnalysisPlugin extends BasePlugin {
  /**
   * Analyze audio data and extract features
   * @param audioData Raw audio data buffer
   * @param options Analysis options
   */
  analyzeAudio(audioData: ArrayBuffer, options?: Record<string, any>): Promise<PluginResult<AudioAnalysisResult>>;
  
  /**
   * Get supported audio formats
   */
  getSupportedAudioFormats(): string[];
}

/**
 * Audio analysis result interface
 */
export interface AudioAnalysisResult {
  duration: number;
  channels: number;
  sampleRate: number;
  peaks?: number[];
  waveform?: number[][];
  loudness?: {
    integrated: number;
    shortTerm: number[];
    momentary: number[];
  };
  markers?: AudioMarker[];
  speechSegments?: SpeechSegment[];
}

export interface AudioMarker {
  id: string;
  time: number;
  type: string;
  label?: string;
  confidence?: number;
}

export interface SpeechSegment {
  start: number;
  end: number;
  speaker?: string;
  transcript?: string;
  confidence?: number;
}

/**
 * Video Analysis Plugin Interface
 * Specialized for video analysis functionality
 */
export interface VideoAnalysisPlugin extends BasePlugin {
  /**
   * Analyze video data and extract features
   * @param videoData Raw video data buffer
   * @param options Analysis options
   */
  analyzeVideo(videoData: ArrayBuffer, options?: Record<string, any>): Promise<PluginResult<VideoAnalysisResult>>;
  
  /**
   * Extract a frame from video at specified time
   * @param videoData Video data
   * @param timeInSeconds Time to extract frame at
   */
  extractFrame(videoData: ArrayBuffer, timeInSeconds: number): Promise<PluginResult<ArrayBuffer>>;
  
  /**
   * Get supported video formats
   */
  getSupportedVideoFormats(): string[];
}

/**
 * Video analysis result interface
 */
export interface VideoAnalysisResult {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  sceneChanges?: SceneChange[];
  motionData?: MotionData[];
  objects?: DetectedObject[];
}

export interface SceneChange {
  time: number;
  confidence: number;
  type?: string;
}

export interface MotionData {
  startTime: number;
  endTime: number;
  intensity: number;
  direction?: string;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  trackId?: string;
  timeRange?: {
    start: number;
    end: number;
  };
}

/**
 * Subtitle Analysis Plugin Interface
 * Specialized for subtitle analysis and processing
 */
export interface SubtitleAnalysisPlugin extends BasePlugin {
  /**
   * Parse subtitle data
   * @param subtitleData Subtitle data as string or buffer
   * @param format Format of the subtitle data
   */
  parseSubtitles(subtitleData: string | ArrayBuffer, format: string): Promise<PluginResult<SubtitleData>>;
  
  /**
   * Convert subtitles to a different format
   * @param subtitleData Parsed subtitle data
   * @param targetFormat Target format to convert to
   */
  convertSubtitles(subtitleData: SubtitleData, targetFormat: string): Promise<PluginResult<string>>;
  
  /**
   * Get supported subtitle formats
   */
  getSupportedSubtitleFormats(): string[];
}

/**
 * Subtitle data interface
 */
export interface SubtitleData {
  entries: SubtitleEntry[];
  metadata?: Record<string, any>;
}

export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style?: Record<string, any>;
  position?: {
    x: number;
    y: number;
  };
}

/**
 * Media Transcoder Plugin Interface
 * Specialized for media transcoding functionality
 */
export interface MediaTranscoderPlugin extends BasePlugin {
  /**
   * Transcode media from one format to another
   * @param mediaData Media data buffer
   * @param sourceFormat Source format
   * @param targetFormat Target format
   * @param options Transcoding options
   */
  transcode(
    mediaData: ArrayBuffer,
    sourceFormat: string,
    targetFormat: string,
    options?: Record<string, any>
  ): Promise<PluginResult<ArrayBuffer>>;
  
  /**
   * Get supported source formats
   */
  getSupportedSourceFormats(): string[];
  
  /**
   * Get supported target formats
   */
  getSupportedTargetFormats(): string[];
}

/**
 * XML Generator Plugin Interface
 * Specialized for generating XML output
 */
export interface XMLGeneratorPlugin extends BasePlugin {
  /**
   * Generate XML from structured data
   * @param data Structured data to convert to XML
   * @param template Optional template name/id to use
   */
  generateXML(data: Record<string, any>, template?: string): Promise<PluginResult<string>>;
  
  /**
   * Validate XML against a schema
   * @param xmlData XML data as string
   * @param schemaData Schema data as string
   */
  validateXML(xmlData: string, schemaData: string): Promise<PluginResult<boolean>>;
  
  /**
   * Get available XML templates
   */
  getAvailableTemplates(): Promise<string[]>;
}

/**
 * Utility Plugin Interface
 * For general utility plugins that don't fit other categories
 */
export interface UtilityPlugin extends BasePlugin {
  /**
   * Execute a utility function
   * @param functionName Name of the function to execute
   * @param args Arguments for the function
   */
  execute(functionName: string, ...args: any[]): Promise<PluginResult>;
  
  /**
   * Get available utility functions
   */
  getAvailableFunctions(): Promise<string[]>;
}
