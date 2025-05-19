/**
 * Types related to audio processing and analysis
 */

export interface Beat {
  time: number;
  confidence: number;
  energy?: number;
  type?: 'downbeat' | 'upbeat';
  index?: number;
}

export interface BeatAnalysis {
  beats: Beat[];
  tempo: number;
  confidence: number;
  timeSignature?: {
    upper: number;
    lower: number;
  };
}

export interface AudioSegment {
  startTime: number;
  endTime: number;
  duration: number;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'drop' | 'buildup' | 'unknown';
  confidence: number;
  energyLevel: number;
  tags?: string[];
}

export interface EnergySample {
  time: number;
  value: number;
}

export interface EnergyAnalysis {
  samples: EnergySample[];
  average: number;
  peak: number;
  energyPoints: {
    high: number[];
    medium: number[];
    low: number[];
  };
  segments: {
    startTime: number;
    endTime: number;
    energyLevel: 'high' | 'medium' | 'low';
  }[];
}

export interface AudioAnalysis {
  id: string;
  duration: number;
  sampleRate: number;
  channels: number;
  beats: Beat[];
  segments: AudioSegment[];
  tempo: number;
  timeSignature?: {
    upper: number;
    lower: number;
  };
  key?: {
    note: string;
    scale: 'major' | 'minor';
    confidence: number;
  };
  loudness: {
    integrated: number;
    truePeak: number;
    range: number;
  };
  energyAnalysis: EnergyAnalysis;
  energyPoints: {
    high: number[];
    medium: number[];
    low: number[];
  };
  waveformData?: number[];
}

export interface AudioFile {
  id: string;
  name: string;
  type: string;
  size: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  file: File;
  url?: string;
  waveform?: number[];
  analysis?: AudioAnalysis;
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/');
}
