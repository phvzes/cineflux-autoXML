/**
 * Types for audio processing and analysis
 */

/**
 * Web Audio API related types
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
   * Window size for processing in milliseconds
   */
  windowSize?: number;
  
  /**
   * Hop size for processing in milliseconds
   */
  hopSize?: number;
  
  /**
   * Minimum frequency to analyze in Hz
   */
  minFrequency?: number;
  
  /**
   * Maximum frequency to analyze in Hz
   */
  maxFrequency?: number;
  
  /**
   * Additional plugin-specific options
   */
  [key: string]: unknown;
}

/**
 * Beat Detection Options
 */
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
  
  /**
   * Energy threshold multiplier for beat detection
   */
  energyThreshold?: number;
  
  /**
   * Minimum energy threshold for beat detection
   */
  minEnergyThreshold?: number;
  
  /**
   * Number of recent energy values to consider
   */
  recentEnergyWindow?: number;
}

/**
 * Energy Analysis Options
 */
export interface EnergyAnalysisOptions extends AudioProcessingOptions {
  /**
   * Number of frequency bands to analyze
   */
  bands?: number;
  
  /**
   * Window size for energy analysis
   */
  windowSize?: number;
  
  /**
   * Whether to normalize energy levels to 0-1 range
   */
  normalize?: boolean;
}

/**
 * Waveform Generation Options
 */
export interface WaveformOptions {
  /**
   * Width of the waveform in pixels
   */
  width?: number;
  
  /**
   * Height of the waveform in pixels
   */
  height?: number;
  
  /**
   * Number of samples to include in the waveform
   */
  samples?: number;
  
  /**
   * Whether to use peak values instead of RMS
   */
  usePeaks?: boolean;
  
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

/**
 * Audio Processing Progress Callback
 */
export type AudioProcessingProgressCallback = (progress: number, step?: string) => void;

/**
 * Represents a single detected beat in the audio
 */
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
  energy?: number;
  
  /**
   * Whether this is a downbeat (first beat of a measure)
   */
  isDownbeat?: boolean;
}

/**
 * Collection of detected beats in the audio
 */
export interface BeatAnalysis {
  /**
   * Array of detected beats
   */
  beats: Beat[];
  
  /**
   * Average confidence of all detected beats
   */
  averageConfidence?: number;
  
  /**
   * Detected tempo in BPM
   */
  tempo?: number;
  
  /**
   * Confidence of the tempo detection (0-1)
   */
  tempoConfidence?: number;
  
  /**
   * Time signature (e.g., 4/4, 3/4)
   */
  timeSignature?: string;
}

/**
 * Represents a single energy sample at a specific point in time
 */
export interface EnergySample {
  /**
   * Time in seconds
   */
  time: number;
  
  /**
   * Energy value (0-1)
   */
  value: number;
  
  /**
   * Energy level (0-1, where 1.0 is maximum energy)
   */
  level: number;
}

/**
 * Collection of energy samples over time
 */
export interface EnergyAnalysis {
  /**
   * Array of energy samples
   */
  samples: EnergySample[];
  
  /**
   * Array of energy samples over time
   */
  energyPoints?: EnergySample[];
  
  /**
   * Average energy level across the entire track
   */
  averageEnergy: number;
  
  /**
   * Peak energy level in the track
   */
  peakEnergy?: number;
  
  /**
   * Timestamp of the peak energy in seconds
   */
  peakEnergyTime?: number;
  
  /**
   * Dynamic range (difference between min and max energy)
   */
  dynamicRange?: number;
}

/**
 * Represents a distinct section in the audio
 */
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
  
  /**
   * Start time in seconds
   */
  start?: number;
  
  /**
   * End time in seconds
   */
  end?: number;
  
  /**
   * Whether this segment is a chorus
   */
  isChorus?: boolean;
  
  /**
   * Energy level of this segment (0-1)
   */
  energyLevel?: number;
}

/**
 * Collection of sections in the audio
 */
export interface SectionAnalysis {
  /**
   * Array of detected sections
   */
  sections: AudioSegment[];
}

/**
 * Waveform data
 */
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
  
  /**
   * Maximum amplitude value
   */
  maxAmplitude?: number;
  
  /**
   * Minimum amplitude value
   */
  minAmplitude?: number;
}

/**
 * Frequency band information for spectral analysis
 */
export interface FrequencyBand {
  /**
   * Lower frequency bound in Hz
   */
  low: number;
  
  /**
   * Upper frequency bound in Hz
   */
  high: number;
  
  /**
   * Average energy in this frequency band (0-1)
   */
  energy: number;
}

/**
 * Spectral analysis of the audio
 */
export interface SpectralAnalysis {
  /**
   * Array of frequency bands
   */
  bands: FrequencyBand[];
  
  /**
   * Spectral centroid (brightness) over time
   */
  centroid?: Array<{
    /**
     * Timestamp in seconds
     */
    time: number;
    
    /**
     * Centroid value in Hz
     */
    value: number;
  }>;
}

/**
 * Represents tempo information of the audio
 */
export interface Tempo {
  /**
   * Beats per minute
   */
  bpm: number;
  
  /**
   * Time signature as a ratio (e.g., 4/4, 3/4)
   */
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  
  /**
   * Confidence level of the tempo detection (0-1)
   */
  confidence: number;
  
  /**
   * Whether the tempo is stable throughout the track
   */
  isStable?: boolean;
  
  /**
   * Tempo variations over time if not stable
   */
  variations?: Array<{
    /**
     * Start time of the tempo variation in seconds
     */
    startTime: number;
    
    /**
     * BPM at this variation point
     */
    bpm: number;
  }>;
}

/**
 * Main interface that aggregates all audio analysis results
 */
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
  
  /**
   * Metadata about the analyzed audio
   */
  metadata2?: {
    /**
     * Title of the audio track
     */
    title?: string;
    
    /**
     * Artist name
     */
    artist?: string;
    
    /**
     * Duration in seconds
     */
    duration: number;
    
    /**
     * File format (e.g., "mp3", "wav")
     */
    format?: string;
    
    /**
     * Analysis timestamp
     */
    analyzedAt: Date;
  };
  
  /**
   * Beat detection results
   */
  beatAnalysis?: BeatAnalysis;
  
  /**
   * Energy analysis
   */
  energy?: EnergyAnalysis;
  
  /**
   * Section analysis
   */
  sections?: SectionAnalysis;
  
  /**
   * Spectral analysis (optional)
   */
  spectral?: SpectralAnalysis;
  
  /**
   * Beat times in seconds
   */
  beatTimes?: number[];
}
