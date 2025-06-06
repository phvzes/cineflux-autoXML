/**
 * Types for audio analysis and processing results
 * This file contains interfaces for representing various aspects of audio analysis
 * including waveform data, beat detection, tempo information, energy analysis, and section analysis.
 */

/**
 * Represents amplitude values over time (waveform data)
 */
export interface Waveform {
  /** Duration of the audio in seconds */
  duration: number;
  /** Sample rate of the audio in Hz */
  sampleRate: number;
  /** Number of channels in the audio (1 for mono, 2 for stereo) */
  channels: number;
  /** Array of amplitude values representing the waveform */
  data: number[];
  /** The maximum amplitude value in the data */
  maxAmplitude?: number;
  /** The minimum amplitude value in the data */
  minAmplitude?: number;
}

/**
 * Represents a single detected beat in the audio
 */
export interface Beat {
  /** Timestamp of the beat in seconds */
  time: number;
  /** Confidence level of the beat detection (0.0 to 1.0) */
  confidence: number;
}

/**
 * Collection of detected beats in the audio
 */
export interface BeatAnalysis {
  /** Array of detected beats */
  beats: Beat[];
  /** Average confidence of all detected beats */
  averageConfidence?: number;
}

/**
 * Represents tempo information of the audio
 */
export interface Tempo {
  /** Beats per minute */
  bpm: number;
  /** Time signature as a ratio (e.g., 4/4, 3/4) */
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  /** Confidence level of the tempo detection (0.0 to 1.0) */
  confidence: number;
  /** Whether the tempo is stable throughout the track */
  isStable?: boolean;
  /** Tempo variations over time if not stable */
  variations?: Array<{
    /** Start time of the tempo variation in seconds */
    startTime: number;
    /** BPM at this variation point */
    bpm: number;
  }>;
}

/**
 * Represents a single energy sample at a specific point in time
 */
export interface EnergySample {
  /** Timestamp of the energy sample in seconds */
  time: number;
  /** Energy level (0.0 to 1.0, where 1.0 is maximum energy) */
  level: number;
}

/**
 * Collection of energy samples over time
 */
export interface EnergyAnalysis {
  /** Array of energy samples */
  samples: EnergySample[];
  /** Average energy level across the entire track */
  averageEnergy: number;
  /** Peak energy level in the track */
  peakEnergy?: number;
  /** Timestamp of the peak energy in seconds */
  peakEnergyTime?: number;
}

/**
 * Represents a distinct section in the audio
 */
export interface Section {
  /** Start time of the section in seconds */
  start: number;
  /** Duration of the section in seconds */
  duration: number;
  /** Label or name of the section (e.g., "intro", "chorus", "verse", "bridge", "outro") */
  label: string;
  /** Confidence level of the section detection (0.0 to 1.0) */
  confidence: number;
  /** Key characteristics of this section (optional) */
  characteristics?: {
    /** Dominant key in this section (e.g., "C", "F#m") */
    key?: string;
    /** Average energy level in this section (0.0 to 1.0) */
    energy?: number;
    /** Mood classification of this section (e.g., "energetic", "calm") */
    mood?: string;
  };
}

/**
 * Collection of sections in the audio
 */
export interface SectionAnalysis {
  /** Array of detected sections */
  sections: Section[];
}

/**
 * Frequency band information for spectral analysis
 */
export interface FrequencyBand {
  /** Lower frequency bound in Hz */
  low: number;
  /** Upper frequency bound in Hz */
  high: number;
  /** Average energy in this frequency band (0.0 to 1.0) */
  energy: number;
}

/**
 * Spectral analysis of the audio
 */
export interface SpectralAnalysis {
  /** Array of frequency bands */
  bands: FrequencyBand[];
  /** Spectral centroid (brightness) over time */
  centroid?: Array<{
    /** Timestamp in seconds */
    time: number;
    /** Centroid value in Hz */
    value: number;
  }>;
}

/**
 * Main interface that aggregates all audio analysis results
 */
export interface AudioAnalysis {
  /** Metadata about the analyzed audio */
  metadata: {
    /** Title of the audio track */
    title?: string;
    /** Artist name */
    artist?: string;
    /** Duration in seconds */
    duration: number;
    /** File format (e.g., "mp3", "wav") */
    format?: string;
    /** Analysis timestamp */
    analyzedAt: Date;
  };
  /** Waveform data */
  waveform: Waveform;
  /** Beat detection results */
  beats: BeatAnalysis;
  /** Tempo information */
  tempo: Tempo;
  /** Energy analysis */
  energy: EnergyAnalysis;
  /** Section analysis */
  sections: SectionAnalysis;
  /** Spectral analysis (optional) */
  spectral?: SpectralAnalysis;
}
