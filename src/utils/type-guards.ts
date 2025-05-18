/**
 * Type guards for the application
 */
import { AudioAnalysis, AudioSegment, Beat, EnergySample } from '../types/audio-types';
import { EditDecision, EditDecisionList } from '../types/edit-types';
import { Scene, VideoAnalysis, VideoFrame, ClipType } from '../types/video-types';
import { VideoFile } from '../types/VideoFile';
import { AppError, ErrorCode } from '../types/errors';

/**
 * Type guard for AudioAnalysis
 */
export function isAudioAnalysis(obj: unknown): obj is AudioAnalysis {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const analysis = obj as Partial<AudioAnalysis>;
  
  return (
    typeof analysis.id === 'string' &&
    typeof analysis.duration === 'number' &&
    typeof analysis.sampleRate === 'number' &&
    typeof analysis.channels === 'number' &&
    Array.isArray(analysis.beats) &&
    typeof analysis.tempo === 'number' &&
    Array.isArray(analysis.segments) &&
    Array.isArray(analysis.energyPoints) &&
    typeof analysis.averageEnergy === 'number'
  );
}

/**
 * Type guard for Beat
 */
export function isBeat(obj: unknown): obj is Beat {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const beat = obj as Partial<Beat>;
  
  return (
    typeof beat.time === 'number' &&
    typeof beat.confidence === 'number' &&
    typeof beat.energy === 'number'
  );
}

/**
 * Type guard for AudioSegment
 */
export function isAudioSegment(obj: unknown): obj is AudioSegment {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const segment = obj as Partial<AudioSegment>;
  
  return (
    typeof segment.startTime === 'number' &&
    typeof segment.endTime === 'number' &&
    typeof segment.duration === 'number' &&
    typeof segment.energy === 'number'
  );
}

/**
 * Type guard for EnergySample
 */
export function isEnergySample(obj: unknown): obj is EnergySample {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const sample = obj as Partial<EnergySample>;
  
  return (
    typeof sample.time === 'number' &&
    typeof sample.value === 'number'
  );
}

/**
 * Type guard for VideoAnalysis
 */
export function isVideoAnalysis(obj: unknown): obj is VideoAnalysis {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const analysis = obj as Partial<VideoAnalysis>;
  
  return (
    typeof analysis.id === 'string' &&
    typeof analysis.duration === 'number' &&
    typeof analysis.width === 'number' &&
    typeof analysis.height === 'number' &&
    typeof analysis.frameRate === 'number' &&
    Array.isArray(analysis.scenes) &&
    Array.isArray(analysis.motionData)
  );
}

/**
 * Type guard for Scene
 */
export function isScene(obj: unknown): obj is Scene {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const scene = obj as Partial<Scene>;
  
  return (
    typeof scene.id === 'string' &&
    typeof scene.startTime === 'number' &&
    typeof scene.endTime === 'number' &&
    typeof scene.duration === 'number'
  );
}

/**
 * Type guard for VideoFrame
 */
export function isVideoFrame(obj: unknown): obj is VideoFrame {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const frame = obj as Partial<VideoFrame>;
  
  return (
    typeof frame.time === 'number' &&
    typeof frame.dataUrl === 'string' &&
    typeof frame.width === 'number' &&
    typeof frame.height === 'number'
  );
}

/**
 * Type guard for ClipType
 */
export function isClipType(value: unknown): value is ClipType {
  return (
    typeof value === 'string' &&
    Object.values(ClipType).includes(value as ClipType)
  );
}

/**
 * Type guard for EditDecision
 */
export function isEditDecision(obj: unknown): obj is EditDecision {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const decision = obj as Partial<EditDecision>;
  
  return (
    typeof decision.id === 'string' &&
    typeof decision.videoIndex === 'number' &&
    isScene(decision.scene) &&
    typeof decision.sourceStartTime === 'number' &&
    typeof decision.sourceEndTime === 'number' &&
    typeof decision.timelineStartTime === 'number' &&
    typeof decision.timelineEndTime === 'number' &&
    typeof decision.duration === 'number' &&
    typeof decision.enabled === 'boolean'
  );
}

/**
 * Type guard for EditDecisionList
 */
export function isEditDecisionList(obj: unknown): obj is EditDecisionList {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const list = obj as Partial<EditDecisionList>;
  
  return (
    typeof list.id === 'string' &&
    typeof list.name === 'string' &&
    Array.isArray(list.decisions) &&
    typeof list.duration === 'number' &&
    Array.isArray(list.markers) &&
    list.createdAt instanceof Date &&
    list.updatedAt instanceof Date
  );
}

/**
 * Type guard for VideoFile
 */
export function isVideoFile(obj: unknown): obj is VideoFile {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const file = obj as Partial<VideoFile>;
  
  return (
    file.metadata !== undefined &&
    file.mimeInfo !== undefined &&
    file.filenameInfo !== undefined &&
    file.videoMetadata !== undefined &&
    typeof file.videoMetadata.frameRate === 'number' &&
    typeof file.videoMetadata.hasAudio === 'boolean' &&
    typeof file.videoMetadata.hasSubtitles === 'boolean'
  );
}

/**
 * Type guard for Error with specific code
 */
export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
  return (
    error instanceof AppError &&
    error.code === code
  );
}

/**
 * Type guard for checking if an object has a specific property
 */
export function hasProperty<K extends string>(obj: unknown, prop: K): obj is { [key in K]: unknown } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    prop in obj
  );
}

/**
 * Type guard for checking if an array contains only items of a specific type
 */
export function isArrayOf<T>(
  arr: unknown,
  typeGuard: (item: unknown) => item is T
): arr is T[] {
  return (
    Array.isArray(arr) &&
    arr.every(item => typeGuard(item))
  );
}

/**
 * Type guard for checking if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Type guard for checking if a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Type guard for checking if a value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Type guard for checking if a value is a valid percentage (0-100)
 */
export function isPercentage(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 100;
}

/**
 * Type guard for checking if a value is a valid time in seconds
 */
export function isTimeInSeconds(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}
