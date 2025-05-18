/**
 * Types for audio processing and analysis
 */

export interface AudioProcessingOptions {
  /**
   * Sample rate for audio processing
   */
  sampleRate?: number;
  
  /**
   * Number of channels to process
   */
  channels?: number;
  
  /**
   * Duration in seconds to process (0 for entire file)
   */
  duration?: number;
  
  /**
   * Start time in seconds
   */
  startTime?: number;
  
  /**
   * Whether to normalize audio levels
   */
  normalize?: boolean;
  
  /**
   * Additional plugin-specific options
   */
  [key: string]: unknown;
}

export interface BeatDetectionOptions extends AudioProcessingOptions {
  /**
   * Sensitivity for beat detection (0-1)
   */
  sensitivity?: number;
  
  /**
   * Minimum BPM to detect
   */
  minBPM?: number;
  
  /**
   * Maximum BPM to detect
   */
  maxBPM?: number;
}

export interface EnergyAnalysisOptions extends AudioProcessingOptions {
  /**
   * Number of frequency bands to analyze
   */
  bands?: number;
  
  /**
   * Window size for energy analysis
   */
  windowSize?: number;
}

export interface WaveformGenerationOptions extends AudioProcessingOptions {
  /**
   * Number of points to generate for the waveform
   */
  resolution?: number;
  
  /**
   * Whether to generate peak data
   */
  includePeaks?: boolean;
  
  /**
   * Whether to generate RMS data
   */
  includeRMS?: boolean;
}

export interface AudioProcessingProgressCallback {
  (progress: number, step: string): void;
}

export interface Beat {
  /**
   * Time in seconds when the beat occurs
   */
  time: number;
  
  /**
   * Confidence level of the beat detection (0-1)
   */
  confidence: number;
  
  /**
   * Energy level at this beat (0-1)
   */
  energy: number;
  
  /**
   * Whether this is a downbeat (first beat of a measure)
   */
  isDownbeat?: boolean;
}

export interface BeatAnalysis {
  /**
   * Array of detected beats
   */
  beats: Beat[];
  
  /**
   * Detected tempo in BPM
   */
  tempo: number;
  
  /**
   * Confidence of the tempo detection (0-1)
   */
  tempoConfidence: number;
  
  /**
   * Time signature (e.g., 4/4, 3/4)
   */
  timeSignature?: string;
}

export interface EnergySample {
  /**
   * Time in seconds
   */
  time: number;
  
  /**
   * Energy value (0-1)
   */
  value: number;
}

export interface EnergyAnalysis {
  /**
   * Array of energy samples over time
   */
  energyPoints: EnergySample[];
  
  /**
   * Average energy level (0-1)
   */
  averageEnergy: number;
  
  /**
   * Peak energy level (0-1)
   */
  peakEnergy: number;
  
  /**
   * Dynamic range (difference between min and max energy)
   */
  dynamicRange: number;
}

export interface AudioSegment {
  /**
   * Start time in seconds
   */
  startTime: number;
  
  /**
   * End time in seconds
   */
  endTime: number;
  
  /**
   * Duration in seconds
   */
  duration: number;
  
  /**
   * Type of segment (e.g., "verse", "chorus", "bridge", "intro", "outro")
   */
  type?: string;
  
  /**
   * Average energy level in this segment (0-1)
   */
  energy: number;
  
  /**
   * Tempo in this segment (BPM)
   */
  tempo?: number;
  
  /**
   * Key of this segment (e.g., "C", "Am")
   */
  key?: string;
  
  /**
   * Additional metadata for this segment
   */
  metadata?: Record<string, unknown>;
}

export interface WaveformData {
  /**
   * Array of amplitude values (-1 to 1)
   */
  data: number[];
  
  /**
   * Sample rate of the waveform data
   */
  sampleRate: number;
  
  /**
   * Number of channels
   */
  channels: number;
  
  /**
   * Duration in seconds
   */
  duration: number;
  
  /**
   * Peak amplitude values
   */
  peaks?: number[];
  
  /**
   * RMS values
   */
  rms?: number[];
}

export interface AudioAnalysis {
  /**
   * Unique identifier for this analysis
   */
  id: string;
  
  /**
   * Duration of the audio in seconds
   */
  duration: number;
  
  /**
   * Sample rate of the audio
   */
  sampleRate: number;
  
  /**
   * Number of channels in the audio
   */
  channels: number;
  
  /**
   * Beat analysis results
   */
  beats: Beat[];
  
  /**
   * Detected tempo in BPM
   */
  tempo: number;
  
  /**
   * Segments identified in the audio
   */
  segments: AudioSegment[];
  
  /**
   * Energy analysis results
   */
  energyPoints: EnergySample[];
  
  /**
   * Average energy level (0-1)
   */
  averageEnergy: number;
  
  /**
   * Waveform data
   */
  waveform?: WaveformData;
  
  /**
   * Additional metadata from the analysis
   */
  metadata?: Record<string, unknown>;
}
