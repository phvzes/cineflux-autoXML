/**
 * audio-types.ts
 * 
 * Central definitions for audio-related types used throughout the application.
 * These types are used for audio analysis, visualization, and editing.
 */

/**
 * Represents a single beat in the audio
 */
export interface Beat {
  /** Time of the beat in seconds */
  time: number;
  /** Confidence level of the beat detection (0-1) */
  confidence?: number;
  /** Energy level at this beat (0-1) */
  energy?: number;
}

/**
 * Represents a segment of audio with a start and end time
 */
export interface AudioSegment {
  /** Unique identifier for the segment */
  id?: string;
  /** Start time of the segment in seconds */
  startTime: number;
  /** End time of the segment in seconds */
  endTime: number;
  /** Type or label of the segment (e.g., 'verse', 'chorus', 'bridge') */
  type?: string;
  /** Confidence level of the segment detection (0-1) */
  boundaryConfidence?: number;
}

/**
 * Represents audio waveform data
 */
export interface AudioWaveform {
  /** Array of amplitude values */
  samples: number[];
  /** Sample rate in Hz */
  sampleRate: number;
  /** Number of channels */
  channels?: number;
  /** Maximum amplitude value */
  maxAmplitude?: number;
}

/**
 * Represents a complete audio analysis result
 */
export interface AudioAnalysis {
  /** Unique identifier for this analysis */
  id?: string;
  /** Duration of the audio in seconds */
  duration: number;
  /** Detected tempo in BPM */
  tempo?: number;
  /** Array of detected beats */
  beats?: Beat[];
  /** Array of detected segments */
  segments?: AudioSegment[];
  /** Waveform data */
  waveform?: AudioWaveform;
  /** Energy points over time */
  energyPoints?: Array<{
    time: number;
    energy: number;
  }>;
  /** Any additional properties */
  [key: string]: any;
}
