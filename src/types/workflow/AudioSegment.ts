/**
 * AudioSegment.ts
 * 
 * This file defines the AudioSegment interface for representing audio segments in analysis.
 */

/**
 * Represents a segment of audio with specific characteristics
 */
export interface AudioSegment {
  /** Start time of the segment in seconds */
  startTime: number;
  /** End time of the segment in seconds */
  endTime: number;
  /** Duration of the segment in seconds */
  duration: number;
  /** Type of the segment (e.g., 'verse', 'chorus', 'bridge', etc.) */
  type?: string;
  /** Energy level of the segment (0-1) */
  energy?: number;
  /** Tempo of the segment in BPM */
  tempo?: number;
  /** Dominant frequency of the segment in Hz */
  dominantFrequency?: number;
  /** Confidence level of the segment detection (0-1) */
  confidence?: number;
  /** Additional metadata for the segment */
  metadata?: Record<string, any>;
}

export default AudioSegment;
