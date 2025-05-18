/**
 * audio-types.ts
 * 
 * Type definitions for audio processing
 */

export interface Beat {
  time: number;
  confidence: number;
}

export interface AudioSegment {
  startTime: number;
  endTime: number;
  type: string;
  energy: number;
}

export interface EnergySample {
  time: number;
  value: number;
}

export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  channels: number;
  beats: Beat[];
  segments: AudioSegment[];
  energy: EnergySample[];
}
