/**
 * Web Worker for audio processing
 * This worker offloads CPU-intensive audio processing tasks from the main thread
 */

// Define worker context type
const ctx: Worker = self as any;

// Import types
import { 
  AudioAnalysis, 
  Beat, 
  BeatAnalysis, 
  Tempo, 
  Waveform, 
  EnergyAnalysis, 
  EnergySample 
} from '../types/AudioAnalysis';

// Message types
export enum AudioWorkerMessageType {
  LOAD_AUDIO = 'LOAD_AUDIO',
  EXTRACT_WAVEFORM = 'EXTRACT_WAVEFORM',
  DETECT_BEATS = 'DETECT_BEATS',
  ANALYZE_ENERGY = 'ANALYZE_ENERGY',
  ESTIMATE_TEMPO = 'ESTIMATE_TEMPO',
  DETECT_SECTIONS = 'DETECT_SECTIONS',
  ANALYZE_AUDIO = 'ANALYZE_AUDIO',
  EXTRACT_BPM = 'EXTRACT_BPM',
  CREATE_WAVEFORM = 'CREATE_WAVEFORM',
  PROGRESS = 'PROGRESS',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

// Message interfaces
export interface AudioWorkerMessage {
  type: AudioWorkerMessageType;
  id: string;
  data?: any;
}

export interface AudioWorkerProgressMessage extends AudioWorkerMessage {
  type: AudioWorkerMessageType.PROGRESS;
  progress: number;
  stage?: string;
}

export interface AudioWorkerResultMessage extends AudioWorkerMessage {
  type: AudioWorkerMessageType.RESULT;
  result: any;
}

export interface AudioWorkerErrorMessage extends AudioWorkerMessage {
  type: AudioWorkerMessageType.ERROR;
  error: string;
  code?: string;
}

// Track pending operations
const pendingOperations = new Map<string, AbortController>();

// Handle messages from the main thread
ctx.addEventListener('message', async (event: MessageEvent<AudioWorkerMessage>) => {
  const { type, id, data } = event.data;
  
  // Create abort controller for this operation
  const abortController = new AbortController();
  pendingOperations.set(id, abortController);
  
  try {
    switch (type) {
      case AudioWorkerMessageType.LOAD_AUDIO:
        await handleLoadAudio(id, data);
        break;
        
      case AudioWorkerMessageType.EXTRACT_WAVEFORM:
        await handleExtractWaveform(id, data);
        break;
        
      case AudioWorkerMessageType.DETECT_BEATS:
        await handleDetectBeats(id, data);
        break;
        
      case AudioWorkerMessageType.ANALYZE_ENERGY:
        await handleAnalyzeEnergy(id, data);
        break;
        
      case AudioWorkerMessageType.ESTIMATE_TEMPO:
        await handleEstimateTempo(id, data);
        break;
        
      case AudioWorkerMessageType.DETECT_SECTIONS:
        await handleDetectSections(id, data);
        break;
        
      case AudioWorkerMessageType.ANALYZE_AUDIO:
        await handleAnalyzeAudio(id, data);
        break;
        
      case AudioWorkerMessageType.EXTRACT_BPM:
        await handleExtractBPM(id, data);
        break;
        
      case AudioWorkerMessageType.CREATE_WAVEFORM:
        await handleCreateWaveform(id, data);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    // Send error message back to main thread
    ctx.postMessage({
      type: AudioWorkerMessageType.ERROR,
      id,
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR'
    } as AudioWorkerErrorMessage);
  } finally {
    // Clean up
    pendingOperations.delete(id);
  }
});

/**
 * Send progress update to main thread
 */
function sendProgress(id: string, progress: number, stage?: string): void {
  ctx.postMessage({
    type: AudioWorkerMessageType.PROGRESS,
    id,
    progress,
    stage
  } as AudioWorkerProgressMessage);
}

/**
 * Send result to main thread
 */
function sendResult(id: string, result: any): void {
  ctx.postMessage({
    type: AudioWorkerMessageType.RESULT,
    id,
    result
  } as AudioWorkerResultMessage);
}

/**
 * Handle LOAD_AUDIO message
 */
async function handleLoadAudio(id: string, data: any): Promise<void> {
  // In a real implementation, we would use AudioContext and decodeAudioData
  // For this example, we'll simulate the process
  
  sendProgress(id, 0.1, 'Initializing audio context...');
  await simulateDelay(100);
  
  sendProgress(id, 0.3, 'Loading audio data...');
  await simulateDelay(200);
  
  sendProgress(id, 0.6, 'Decoding audio data...');
  await simulateDelay(300);
  
  sendProgress(id, 1.0, 'Audio loaded successfully');
  
  // Send mock AudioBuffer result
  sendResult(id, {
    sampleRate: 44100,
    length: 1000000,
    duration: 22.7,
    numberOfChannels: 2,
    // We can't transfer actual AudioBuffer to main thread,
    // so we'd need to extract the raw data and reconstruct it
    _rawData: new Float32Array(1000)
  });
}

/**
 * Handle EXTRACT_WAVEFORM message
 */
async function handleExtractWaveform(id: string, data: any): Promise<void> {
  const { audioBuffer } = data;
  
  // Process in chunks to avoid blocking
  const totalChunks = 10;
  
  for (let i = 0; i < totalChunks; i++) {
    // Report progress
    sendProgress(id, (i + 1) / totalChunks);
    
    // Simulate processing delay
    await simulateDelay(50);
  }
  
  // Create mock waveform data
  const waveform: Waveform = {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    data: Array.from({ length: 1000 }, () => Math.random()),
    maxAmplitude: 1.0,
    minAmplitude: 0.0
  };
  
  sendResult(id, waveform);
}

/**
 * Handle DETECT_BEATS message
 */
async function handleDetectBeats(id: string, data: any): Promise<void> {
  const { audioBuffer } = data;
  
  // Process in chunks to avoid blocking
  const totalChunks = 20;
  
  for (let i = 0; i < totalChunks; i++) {
    // Report progress
    sendProgress(id, (i + 1) / totalChunks);
    
    // Simulate processing delay
    await simulateDelay(30);
  }
  
  // Create mock beat analysis data
  const beatAnalysis: BeatAnalysis = {
    beats: Array.from({ length: 100 }, (_, i) => ({
      time: i * 0.5,
      confidence: 0.7 + Math.random() * 0.3
    })),
    averageConfidence: 0.85
  };
  
  sendResult(id, beatAnalysis);
}

/**
 * Handle ANALYZE_ENERGY message
 */
async function handleAnalyzeEnergy(id: string, data: any): Promise<void> {
  const { audioBuffer } = data;
  
  // Process in chunks to avoid blocking
  const totalChunks = 15;
  
  for (let i = 0; i < totalChunks; i++) {
    // Report progress
    sendProgress(id, (i + 1) / totalChunks);
    
    // Simulate processing delay
    await simulateDelay(40);
  }
  
  // Create mock energy analysis data
  const energyAnalysis: EnergyAnalysis = {
    samples: Array.from({ length: 200 }, (_, i) => ({
      time: i * 0.1,
      level: 0.2 + Math.random() * 0.8
    })),
    averageEnergy: 0.6,
    peakEnergy: 1.0,
    peakEnergyTime: 10.5
  };
  
  sendResult(id, energyAnalysis);
}

/**
 * Handle ESTIMATE_TEMPO message
 */
async function handleEstimateTempo(id: string, data: any): Promise<void> {
  const { beats, duration } = data;
  
  // Simulate processing delay
  await simulateDelay(200);
  
  // Create mock tempo data
  const tempo: Tempo = {
    bpm: 120 + Math.floor(Math.random() * 40),
    timeSignature: { numerator: 4, denominator: 4 },
    confidence: 0.9,
    isStable: true
  };
  
  sendResult(id, tempo);
}

/**
 * Handle DETECT_SECTIONS message
 */
async function handleDetectSections(id: string, data: any): Promise<void> {
  const { energyAnalysis, beatAnalysis, duration } = data;
  
  // Simulate processing delay
  await simulateDelay(300);
  
  // Create mock sections data
  const sections = {
    sections: [
      { start: 0, duration: 30, label: 'Section 1', confidence: 0.8 },
      { start: 30, duration: 45, label: 'Section 2', confidence: 0.9 },
      { start: 75, duration: 30, label: 'Section 3', confidence: 0.7 },
      { start: 105, duration: 15, label: 'Section 4', confidence: 0.85 }
    ]
  };
  
  sendResult(id, sections);
}

/**
 * Handle ANALYZE_AUDIO message
 */
async function handleAnalyzeAudio(id: string, data: any): Promise<void> {
  const { audioFile } = data;
  
  // Simulate loading audio
  sendProgress(id, 0.1, 'Loading audio file...');
  await simulateDelay(200);
  
  // Mock audio buffer
  const audioBuffer = {
    duration: 120,
    sampleRate: 44100,
    numberOfChannels: 2,
    length: 5292000
  };
  
  // Extract waveform
  sendProgress(id, 0.3, 'Extracting waveform...');
  await simulateDelay(300);
  
  const waveform: Waveform = {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    data: Array.from({ length: 1000 }, () => Math.random()),
    maxAmplitude: 1.0,
    minAmplitude: 0.0
  };
  
  // Detect beats
  sendProgress(id, 0.5, 'Detecting beats...');
  await simulateDelay(400);
  
  const beatAnalysis: BeatAnalysis = {
    beats: Array.from({ length: 100 }, (_, i) => ({
      time: i * 0.5,
      confidence: 0.7 + Math.random() * 0.3
    })),
    averageConfidence: 0.85
  };
  
  // Analyze energy
  sendProgress(id, 0.7, 'Analyzing energy levels...');
  await simulateDelay(300);
  
  const energyAnalysis: EnergyAnalysis = {
    samples: Array.from({ length: 200 }, (_, i) => ({
      time: i * 0.1,
      level: 0.2 + Math.random() * 0.8
    })),
    averageEnergy: 0.6,
    peakEnergy: 1.0,
    peakEnergyTime: 10.5
  };
  
  // Estimate tempo
  sendProgress(id, 0.8, 'Estimating tempo...');
  await simulateDelay(200);
  
  const tempo: Tempo = {
    bpm: 120 + Math.floor(Math.random() * 40),
    timeSignature: { numerator: 4, denominator: 4 },
    confidence: 0.9,
    isStable: true
  };
  
  // Detect sections
  sendProgress(id, 0.9, 'Detecting sections...');
  await simulateDelay(200);
  
  const sections = {
    sections: [
      { start: 0, duration: 30, label: 'Section 1', confidence: 0.8 },
      { start: 30, duration: 45, label: 'Section 2', confidence: 0.9 },
      { start: 75, duration: 30, label: 'Section 3', confidence: 0.7 },
      { start: 105, duration: 15, label: 'Section 4', confidence: 0.85 }
    ]
  };
  
  // Complete analysis
  sendProgress(id, 1.0, 'Analysis complete');
  
  // Create complete analysis result
  const analysis: AudioAnalysis = {
    metadata: {
      title: audioFile.name,
      duration: audioBuffer.duration,
      format: audioFile.type.split('/')[1] || 'unknown',
      analyzedAt: new Date()
    },
    waveform,
    beats: beatAnalysis,
    tempo,
    energy: energyAnalysis,
    sections
  };
  
  sendResult(id, analysis);
}

/**
 * Handle EXTRACT_BPM message
 */
async function handleExtractBPM(id: string, data: any): Promise<void> {
  const { audioFile } = data;
  
  // Simulate processing delay
  await simulateDelay(500);
  
  // Create mock BPM data
  const bpmData = {
    bpm: 120 + Math.floor(Math.random() * 40),
    beats: Array.from({ length: 100 }, (_, i) => i * (60 / 120))
  };
  
  sendResult(id, bpmData);
}

/**
 * Handle CREATE_WAVEFORM message
 */
async function handleCreateWaveform(id: string, data: any): Promise<void> {
  const { audioFile, width, height } = data;
  
  // Simulate processing delay
  await simulateDelay(400);
  
  // Create mock waveform data
  const waveformData = Array.from({ length: width }, () => Math.random() * height);
  
  sendResult(id, waveformData);
}

/**
 * Simulate a processing delay
 */
async function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export worker
export default {} as typeof Worker & { new(): Worker };
