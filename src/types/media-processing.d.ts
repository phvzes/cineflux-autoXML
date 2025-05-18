/**
 * media-processing.d.ts
 * 
 * Type definitions for media processing, WebAssembly and Web Audio API interactions
 */

/**
 * WebAssembly Module Interface for Audio Processing
 */
export interface AudioProcessingWasmModule extends WebAssembly.Module {
  /** Initialize the module */
  _initialize?: () => number;
  /** Process audio data */
  _process_audio?: (bufferPtr: number, length: number, sampleRate: number) => number;
  /** Detect beats in audio data */
  _detect_beats?: (bufferPtr: number, length: number, sampleRate: number) => number;
  /** Analyze energy in audio data */
  _analyze_energy?: (bufferPtr: number, length: number, sampleRate: number) => number;
  /** Allocate memory */
  _malloc?: (size: number) => number;
  /** Free memory */
  _free?: (ptr: number) => void;
  /** Get result buffer pointer */
  _get_result_buffer?: () => number;
  /** Get result buffer length */
  _get_result_length?: () => number;
}

/**
 * WebAssembly Module Interface for Video Processing
 */
export interface VideoProcessingWasmModule extends WebAssembly.Module {
  /** Initialize the module */
  _initialize?: () => number;
  /** Process video frame */
  _process_frame?: (framePtr: number, width: number, height: number) => number;
  /** Detect scenes in video */
  _detect_scenes?: (framesPtr: number, framesCount: number) => number;
  /** Analyze motion in video */
  _analyze_motion?: (framesPtr: number, framesCount: number) => number;
  /** Allocate memory */
  _malloc?: (size: number) => number;
  /** Free memory */
  _free?: (ptr: number) => void;
  /** Get result buffer pointer */
  _get_result_buffer?: () => number;
  /** Get result buffer length */
  _get_result_length?: () => number;
}

/**
 * Web Audio API Context Options
 */
export interface AudioContextOptions {
  /** The sample rate to use for the AudioContext */
  sampleRate?: number;
  /** The latency hint to use for the AudioContext */
  latencyHint?: AudioContextLatencyCategory | number;
  /** Whether to use a secure context */
  sinkId?: string;
}

/**
 * Audio Processing Options
 */
export interface AudioProcessingOptions {
  /** Window size for processing in milliseconds */
  windowSize?: number;
  /** Hop size for processing in milliseconds */
  hopSize?: number;
  /** Minimum frequency to analyze in Hz */
  minFrequency?: number;
  /** Maximum frequency to analyze in Hz */
  maxFrequency?: number;
  /** Sensitivity for beat detection (0.0 to 1.0) */
  beatSensitivity?: number;
  /** Whether to normalize audio before processing */
  normalize?: boolean;
}

/**
 * Beat Detection Options
 */
export interface BeatDetectionOptions extends AudioProcessingOptions {
  /** Energy threshold multiplier for beat detection */
  energyThreshold?: number;
  /** Minimum energy threshold for beat detection */
  minEnergyThreshold?: number;
  /** Number of recent energy values to consider */
  recentEnergyWindow?: number;
}

/**
 * Energy Analysis Options
 */
export interface EnergyAnalysisOptions extends AudioProcessingOptions {
  /** Window size for energy analysis in milliseconds */
  windowSize?: number;
  /** Whether to normalize energy levels to 0-1 range */
  normalize?: boolean;
}

/**
 * Waveform Generation Options
 */
export interface WaveformOptions {
  /** Width of the waveform in pixels */
  width?: number;
  /** Height of the waveform in pixels */
  height?: number;
  /** Number of samples to include in the waveform */
  samples?: number;
  /** Whether to use peak values instead of RMS */
  usePeaks?: boolean;
}

/**
 * Audio Processing Progress Callback
 */
export type AudioProcessingProgressCallback = (progress: number, step?: string) => void;

/**
 * Video Processing Options
 */
export interface VideoProcessingOptions {
  /** Maximum number of frames to process */
  maxFrames?: number;
  /** Interval between frames in seconds */
  frameInterval?: number;
  /** Quality of extracted frames (0.0 to 1.0) */
  quality?: number;
  /** Whether to use WebAssembly for processing */
  useWasm?: boolean;
  /** Sensitivity for scene detection (0.0 to 1.0) */
  sceneSensitivity?: number;
}

/**
 * Frame Extraction Options
 */
export interface FrameExtractionOptions {
  /** Interval between frames in seconds */
  interval?: number;
  /** Maximum number of frames to extract */
  maxFrames?: number;
  /** Quality of extracted frames (0.0 to 1.0) */
  quality?: number;
}

/**
 * Video Processing Progress Callback
 */
export type VideoProcessingProgressCallback = (progress: number, step?: string) => void;
