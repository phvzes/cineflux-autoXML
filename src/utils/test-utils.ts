/**
 * Utility types and functions for testing
 */

import { AudioAnalysis, Beat, AudioSegment } from '../types/audio-types';
import { VideoAnalysis, Scene, VideoFrame, ClipType } from '../types/video-types';
import { EditDecision, EditDecisionList, Transition, TransitionType } from '../types/edit-types';
import { WorkflowStep, WorkflowState, WorkflowOptions } from '../types/workflow-types';

// Use either Jest or Vitest based on project configuration
let jestOrVitest: { fn: Function };

try {
  // Try to import from Jest
  jestOrVitest = require('@jest/globals').jest;
} catch (e) {
  try {
    // Try to import from Vitest
    jestOrVitest = require('vitest').vi;
  } catch (e) {
    // Fallback to a simple mock function
    jestOrVitest = {
      fn: () => jest.fn ? jest.fn() : (() => {})
    };
  }
}

/**
 * Interface for a mock file with additional methods for testing
 */
export interface MockFile extends File {
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * Creates a mock file for testing
 * @param name - The name of the file
 * @param type - The MIME type of the file
 * @param size - The size of the file in bytes
 * @returns A mock file object
 */
export function createMockFile(name: string, type: string, size: number = 1024): MockFile {
  const file = new File([''], name, { type }) as MockFile;
  
  // Add arrayBuffer method
  Object.defineProperty(file, 'arrayBuffer', {
    value: jestOrVitest.fn().mockResolvedValue(new ArrayBuffer(size)),
  });
  
  return file;
}

/**
 * Creates a mock audio buffer for testing
 * @param duration - The duration of the audio in seconds
 * @param numberOfChannels - The number of audio channels
 * @param sampleRate - The sample rate of the audio in Hz
 * @returns A mock audio buffer object
 */
export function createMockAudioBuffer(duration: number = 120, numberOfChannels: number = 2, sampleRate: number = 44100): AudioBuffer {
  return {
    duration,
    numberOfChannels,
    sampleRate,
    getChannelData: jestOrVitest.fn().mockReturnValue(new Float32Array(10)),
    length: duration * sampleRate,
    copyFromChannel: jestOrVitest.fn(),
    copyToChannel: jestOrVitest.fn(),
  } as unknown as AudioBuffer;
}

/**
 * Creates a mock beat for testing
 * @param time - The time of the beat in seconds
 * @param confidence - The confidence score of the beat detection (0-1)
 * @param energy - The energy level at this beat (0-1)
 * @returns A mock beat object
 */
export function createMockBeat(time: number, confidence: number = 0.9, energy: number = 0.8): Beat {
  return {
    time,
    confidence,
    energy,
    isDownbeat: time % 4 < 0.1, // Make every 4th beat a downbeat
  };
}

/**
 * Creates a mock audio segment for testing
 * @param startTime - The start time of the segment in seconds
 * @param endTime - The end time of the segment in seconds
 * @param energy - The energy level of the segment (0-1)
 * @returns A mock audio segment object
 */
export function createMockAudioSegment(startTime: number, endTime: number, energy: number = 0.7): AudioSegment {
  return {
    startTime,
    endTime,
    duration: endTime - startTime,
    energy,
    type: startTime % 30 < 15 ? 'verse' : 'chorus', // Alternate between verse and chorus
    tempo: 120,
    key: 'C',
    metadata: {},
    start: startTime,
    end: endTime,
    isChorus: startTime % 30 >= 15,
    energyLevel: energy,
  };
}

/**
 * Creates a mock audio analysis result for testing
 * @param duration - The duration of the audio in seconds
 * @param beatCount - The number of beats to generate
 * @param segmentCount - The number of segments to generate
 * @returns A mock audio analysis object
 */
export function createMockAudioAnalysis(duration: number = 120, beatCount: number = 120, segmentCount: number = 8): AudioAnalysis {
  const beats: Beat[] = Array.from(
    { length: beatCount },
    (_, i) => createMockBeat(i * (duration / beatCount))
  );
  
  const segments: AudioSegment[] = Array.from(
    { length: segmentCount },
    (_, i) => createMockAudioSegment(
      i * (duration / segmentCount),
      (i + 1) * (duration / segmentCount)
    )
  );
  
  const energyPoints = Array.from(
    { length: 240 },
    (_, i) => ({
      time: i * 0.5,
      value: 0.5 + 0.5 * Math.sin(i * 0.1),
      level: 0.5 + 0.5 * Math.sin(i * 0.1),
    })
  );
  
  return {
    id: 'mock-audio-analysis',
    duration,
    sampleRate: 44100,
    channels: 2,
    beats,
    tempo: 120,
    segments,
    energyPoints,
    averageEnergy: 0.65,
    beatTimes: beats.map(beat => beat.time),
    beatAnalysis: {
      beats,
      averageConfidence: 0.9,
      tempo: 120,
      tempoConfidence: 0.95,
      timeSignature: '4/4',
    },
    metadata: {},
    metadata2: {
      title: 'Mock Audio',
      artist: 'Test Artist',
      duration,
      format: 'mp3',
      analyzedAt: new Date(),
    },
  };
}

/**
 * Creates a mock scene for testing
 * @param startTime - The start time of the scene in seconds
 * @param endTime - The end time of the scene in seconds
 * @param id - The ID of the scene
 * @returns A mock scene object
 */
export function createMockScene(startTime: number, endTime: number, id: string = `scene-${startTime}`): Scene {
  return {
    id,
    startTime,
    endTime,
    duration: endTime - startTime,
    keyFrame: {
      time: startTime + (endTime - startTime) / 2,
      dataUrl: `data:image/jpeg;base64,mockImageData${id}`,
      width: 1920,
      height: 1080,
      dominantColors: ['#336699', '#993366'],
      brightness: 0.7,
      contrast: 0.8,
    },
    clipType: ClipType.MEDIUM,
    motionLevel: 0.5,
    brightness: 0.7,
    contrast: 0.8,
    metadata: {},
    keyFrameUrl: `https://example.com/frames/${id}.jpg`,
  };
}

/**
 * Creates a mock video frame for testing
 * @param time - The time of the frame in seconds
 * @param width - The width of the frame in pixels
 * @param height - The height of the frame in pixels
 * @returns A mock video frame object
 */
export function createMockVideoFrame(time: number, width: number = 1920, height: number = 1080): VideoFrame {
  return {
    time,
    dataUrl: `data:image/jpeg;base64,mockFrameData${time}`,
    width,
    height,
    dominantColors: ['#336699', '#993366'],
    brightness: 0.7,
    contrast: 0.8,
    motionBlur: 0.2,
  };
}

/**
 * Creates a mock video analysis result for testing
 * @param duration - The duration of the video in seconds
 * @param sceneCount - The number of scenes to generate
 * @param frameCount - The number of frames to generate
 * @returns A mock video analysis object
 */
export function createMockVideoAnalysis(duration: number = 120, sceneCount: number = 10, frameCount: number = 24): VideoAnalysis {
  const sceneDuration = duration / sceneCount;
  
  const scenes: Scene[] = Array.from(
    { length: sceneCount },
    (_, i) => createMockScene(
      i * sceneDuration,
      (i + 1) * sceneDuration,
      `scene-${i}`
    )
  );
  
  const frames: VideoFrame[] = Array.from(
    { length: frameCount },
    (_, i) => createMockVideoFrame(i * (duration / frameCount))
  );
  
  const motionData = Array.from(
    { length: 120 },
    (_, i) => ({
      time: i,
      value: 0.5 + 0.5 * Math.sin(i * 0.1),
      direction: (i * 30) % 360,
      motionByFrame: [
        {
          frameIndex: i * 2,
          value: 0.5 + 0.5 * Math.sin(i * 0.1),
          direction: (i * 30) % 360,
        },
        {
          frameIndex: i * 2 + 1,
          value: 0.5 + 0.5 * Math.sin((i + 0.5) * 0.1),
          direction: ((i + 0.5) * 30) % 360,
        },
      ],
    })
  );
  
  return {
    id: 'mock-video-analysis',
    duration,
    width: 1920,
    height: 1080,
    frameRate: 30,
    scenes,
    frames,
    motionData,
    clipType: ClipType.MEDIUM,
    metadata: {},
    resolution: { width: 1920, height: 1080 },
    videoId: 'mock-video',
  };
}

/**
 * Creates a mock transition for testing
 * @param type - The type of transition
 * @param duration - The duration of the transition in seconds
 * @returns A mock transition object
 */
export function createMockTransition(type: TransitionType, duration: number = 1): Transition {
  return {
    type,
    duration,
    params: {},
  };
}

/**
 * Creates a mock edit decision for testing
 * @param id - The ID of the edit decision
 * @param videoIndex - The index of the video file
 * @param sourceStartTime - The start time in the source video
 * @param sourceEndTime - The end time in the source video
 * @param timelineStartTime - The start time in the timeline
 * @param timelineEndTime - The end time in the timeline
 * @returns A mock edit decision object
 */
export function createMockEditDecision(
  id: string,
  videoIndex: number,
  sourceStartTime: number,
  sourceEndTime: number,
  timelineStartTime: number,
  timelineEndTime: number
): EditDecision {
  return {
    id,
    videoIndex,
    scene: createMockScene(sourceStartTime, sourceEndTime, `scene-${id}`),
    sourceStartTime,
    sourceEndTime,
    timelineStartTime,
    timelineEndTime,
    duration: timelineEndTime - timelineStartTime,
    transition: sourceStartTime > 0 ? createMockTransition(TransitionType.CUT) : undefined,
    enabled: true,
    metadata: {},
    time: timelineStartTime,
    clipIndex: videoIndex,
    onBeat: true,
    energy: 0.7,
    importance: 0.8,
  };
}

/**
 * Creates a mock edit decision list for testing
 * @param id - The ID of the edit decision list
 * @param name - The name of the edit decision list
 * @param decisionCount - The number of edit decisions to generate
 * @param duration - The total duration of the timeline
 * @returns A mock edit decision list object
 */
export function createMockEditDecisionList(
  id: string,
  name: string,
  decisionCount: number = 10,
  duration: number = 120
): EditDecisionList {
  const decisionDuration = duration / decisionCount;
  
  const decisions: EditDecision[] = Array.from(
    { length: decisionCount },
    (_, i) => createMockEditDecision(
      `decision-${i}`,
      Math.floor(i / 3), // Group decisions by video index
      i * decisionDuration,
      (i + 1) * decisionDuration,
      i * decisionDuration,
      (i + 1) * decisionDuration
    )
  );
  
  return {
    id,
    name,
    decisions,
    duration,
  };
}

/**
 * Creates a mock workflow state for testing
 * @param currentStep - The current step in the workflow
 * @param inProgress - Whether the workflow is in progress
 * @param isComplete - Whether the workflow is complete
 * @param previousStep - The previous step in the workflow
 * @param error - Error message if any
 * @returns A mock workflow state object
 */
export function createMockWorkflowState(
  currentStep: WorkflowStep,
  inProgress: boolean = true,
  isComplete: boolean = false,
  previousStep?: WorkflowStep,
  error?: string
): WorkflowState {
  return {
    currentStep,
    previousStep,
    inProgress,
    isComplete,
    error,
  };
}

/**
 * Creates a mock workflow options object for testing
 * @param autoProceed - Whether to auto-proceed to the next step
 * @param skipSteps - Steps to skip in the workflow
 * @param customParams - Custom parameters for the workflow
 * @returns A mock workflow options object
 */
export function createMockWorkflowOptions(
  autoProceed: boolean = false,
  skipSteps: WorkflowStep[] = [],
  customParams: Record<string, any> = {}
): WorkflowOptions {
  return {
    autoProceed,
    skipSteps,
    customParams,
  };
}

/**
 * Creates a mock event emitter for testing
 * @returns A mock event emitter object
 */
export function createMockEventEmitter(): { on: jest.Mock; emit: jest.Mock; removeListener: jest.Mock } {
  return {
    on: jestOrVitest.fn(),
    emit: jestOrVitest.fn(),
    removeListener: jestOrVitest.fn(),
  };
}

/**
 * Creates a mock audio context for testing
 * @returns A mock audio context object
 */
export function createMockAudioContext(): AudioContext {
  return {
    decodeAudioData: jestOrVitest.fn(),
    createAnalyser: jestOrVitest.fn(),
    createGain: jestOrVitest.fn(),
    createOscillator: jestOrVitest.fn(),
    createBufferSource: jestOrVitest.fn(),
    destination: {} as AudioDestinationNode,
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    onstatechange: null,
    close: jestOrVitest.fn().mockResolvedValue(undefined),
    suspend: jestOrVitest.fn().mockResolvedValue(undefined),
    resume: jestOrVitest.fn().mockResolvedValue(undefined),
    createBuffer: jestOrVitest.fn(),
    createChannelMerger: jestOrVitest.fn(),
    createChannelSplitter: jestOrVitest.fn(),
    createConstantSource: jestOrVitest.fn(),
    createConvolver: jestOrVitest.fn(),
    createDelay: jestOrVitest.fn(),
    createDynamicsCompressor: jestOrVitest.fn(),
    createBiquadFilter: jestOrVitest.fn(),
    createIIRFilter: jestOrVitest.fn(),
    createPanner: jestOrVitest.fn(),
    createPeriodicWave: jestOrVitest.fn(),
    createScriptProcessor: jestOrVitest.fn(),
    createStereoPanner: jestOrVitest.fn(),
    createWaveShaper: jestOrVitest.fn(),
    getOutputTimestamp: jestOrVitest.fn().mockReturnValue({ contextTime: 0, performanceTime: 0 }),
    addEventListener: jestOrVitest.fn(),
    removeEventListener: jestOrVitest.fn(),
    dispatchEvent: jestOrVitest.fn().mockReturnValue(true),
    audioWorklet: {} as AudioWorklet,
    baseLatency: 0,
    listener: {} as AudioListener,
  } as unknown as AudioContext;
}

/**
 * Type guard to check if an object is an AudioAnalysis
 * @param obj - The object to check
 * @returns True if the object is an AudioAnalysis, false otherwise
 */
export function isAudioAnalysis(obj: any): obj is AudioAnalysis {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.duration === 'number' &&
    typeof obj.sampleRate === 'number' &&
    typeof obj.channels === 'number' &&
    Array.isArray(obj.beats) &&
    typeof obj.tempo === 'number' &&
    Array.isArray(obj.segments) &&
    Array.isArray(obj.energyPoints) &&
    typeof obj.averageEnergy === 'number'
  );
}

/**
 * Type guard to check if an object is a VideoAnalysis
 * @param obj - The object to check
 * @returns True if the object is a VideoAnalysis, false otherwise
 */
export function isVideoAnalysis(obj: any): obj is VideoAnalysis {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.duration === 'number' &&
    typeof obj.width === 'number' &&
    typeof obj.height === 'number' &&
    typeof obj.frameRate === 'number' &&
    Array.isArray(obj.scenes) &&
    Array.isArray(obj.motionData)
  );
}

/**
 * Type guard to check if an object is an EditDecision
 * @param obj - The object to check
 * @returns True if the object is an EditDecision, false otherwise
 */
export function isEditDecision(obj: any): obj is EditDecision {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.videoIndex === 'number' &&
    typeof obj.sourceStartTime === 'number' &&
    typeof obj.sourceEndTime === 'number' &&
    typeof obj.timelineStartTime === 'number' &&
    typeof obj.timelineEndTime === 'number' &&
    typeof obj.duration === 'number' &&
    typeof obj.enabled === 'boolean'
  );
}

/**
 * Type guard to check if an object is a WorkflowState
 * @param obj - The object to check
 * @returns True if the object is a WorkflowState, false otherwise
 */
export function isWorkflowState(obj: any): obj is WorkflowState {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.currentStep === 'string' &&
    typeof obj.inProgress === 'boolean' &&
    typeof obj.isComplete === 'boolean'
  );
}
