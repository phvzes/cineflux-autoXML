/**
 * audio-types.ts
 * 
 * Type definitions for audio processing functionality.
 */

export interface Beat {
  id: string;
  time: number;
  confidence: number;
  strength: number;
  type: BeatType;
}

export enum BeatType {
  DOWNBEAT = 'downbeat',
  UPBEAT = 'upbeat',
  OFFBEAT = 'offbeat'
}

export interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  energy: number;
  type: SegmentType;
}

export enum SegmentType {
  INTRO = 'intro',
  VERSE = 'verse',
  CHORUS = 'chorus',
  BRIDGE = 'bridge',
  OUTRO = 'outro',
  BREAKDOWN = 'breakdown',
  UNKNOWN = 'unknown'
}

export interface EnergySample {
  time: number;
  value: number;
}

export interface BeatAnalysis {
  beats: Beat[];
  tempo: number;
  confidence: number;
}

export interface EnergyAnalysis {
  samples: EnergySample[];
  segments: AudioSegment[];
  average: number;
  peak: number;
  dynamic: number;
}

export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  channels: number;
  waveform: number[];
  beatAnalysis?: BeatAnalysis;
  energyAnalysis?: EnergyAnalysis;
  segments?: AudioSegment[];
}

export interface AudioProcessingOptions {
  beatDetection?: boolean;
  energyAnalysis?: boolean;
  segmentation?: boolean;
  onProgress?: (progress: number) => void;
}
