/**
 * Beat.ts
 * 
 * This file defines the Beat interface for representing beat detection results.
 */

/**
 * Represents a detected beat in an audio file
 */
export interface Beat {
  /** Time of the beat in seconds */
  time: number;
  /** Confidence level of the beat detection (0-1) */
  confidence: number;
  /** Beat strength or intensity */
  strength?: number;
  /** Beat type (e.g., 'kick', 'snare', etc.) */
  type?: string;
  /** Beat index in the sequence */
  index?: number;
}

export default Beat;
