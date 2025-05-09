/**
 * Audio Analysis Worker
 * 
 * This worker handles intensive audio processing tasks off the main thread,
 * including beat detection, waveform generation, and feature extraction.
 */

import Meyda from 'meyda';
import { Beat, EnergySample, Section } from '../../../types/AudioAnalysis';

// Define worker task types
export enum WorkerTaskType {
  ANALYZE_AUDIO = 'ANALYZE_AUDIO',
  EXTRACT_WAVEFORM = 'EXTRACT_WAVEFORM',
  DETECT_BEATS = 'DETECT_BEATS',
  EXTRACT_FEATURES = 'EXTRACT_FEATURES',
  ANALYZE_SECTIONS = 'ANALYZE_SECTIONS'
}

// Define worker response types
export enum WorkerResponseType {
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  WAVEFORM_READY = 'WAVEFORM_READY',
  BEATS_DETECTED = 'BEATS_DETECTED',
  FEATURES_EXTRACTED = 'FEATURES_EXTRACTED',
  SECTIONS_ANALYZED = 'SECTIONS_ANALYZED',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE',
  ERROR = 'ERROR'
}

// Worker message interfaces
interface WorkerRequest {
  type: WorkerTaskType;
  audioData?: AudioBuffer | Float32Array;
  sampleRate?: number;
  options?: any;
}

// Response interface for type safety
interface WorkerResponse {
  type: WorkerResponseType;
  data?: any;
  progress?: number;
  error?: string;
}

// Setup the worker context
const ctx: Worker = self as any;

// Initialize audio context for processing
let audioContext: OfflineAudioContext | null = null;

/**
 * Extract waveform data from audio buffer
 */
function extractWaveform(audioBuffer: AudioBuffer, resolution = 1000): Float32Array {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = Math.min(audioBuffer.length, resolution);
  const waveform = new Float32Array(length);
  
  // Get the first channel data
  const channelData = audioBuffer.getChannelData(0);
  
  // Calculate the step size to achieve the desired resolution
  const step = Math.floor(channelData.length / length);
  
  // Extract amplitude values at regular intervals
  for (let i = 0; i < length; i++) {
    const index = i * step;
    let sum = 0;
    
    // Average across all channels
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      sum += Math.abs(channelData[index]);
    }
    
    waveform[i] = sum / numberOfChannels;
  }
  
  return waveform;
}

/**
 * Detect beats using Meyda's RMS and spectral flux
 */
function detectBeats(audioBuffer: AudioBuffer, options: any = {}): Beat[] {
  const { minConfidence = 0.5, sensitivity = 1.5 } = options;
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const beats: Beat[] = [];
  
  // Frame size and hop size for analysis (in samples)
  const frameSize = 1024;
  const hopSize = 512;
  
  // Process audio in frames
  let previousFlux = 0;
  let fluxThreshold = 0;
  const fluxHistory: number[] = [];
  const thresholdHistory: number[] = [];
  
  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    // Extract frame
    const frame = channelData.slice(i, i + frameSize);
    
    // Calculate features manually
    const features = Meyda.extract(['rms', 'spectralFlux'], frame);
    
    // Safely access features
    const currentFlux = features?.spectralFlux || 0;
    const rms = features?.rms || 0;
    
    // Dynamic threshold based on recent flux history
    fluxHistory.push(currentFlux);
    if (fluxHistory.length > 30) fluxHistory.shift();
    
    // Calculate adaptive threshold
    fluxThreshold = sensitivity * fluxHistory.reduce((sum, val) => sum + val, 0) / fluxHistory.length;
    thresholdHistory.push(fluxThreshold);
    
    // Beat detection logic
    if (
      currentFlux > fluxThreshold && 
      currentFlux > previousFlux && 
      rms > 0.01 // Ignore very quiet sections
    ) {
      const confidence = Math.min(1, (currentFlux - fluxThreshold) / fluxThreshold);
      
      if (confidence >= minConfidence) {
        const time = i / sampleRate;
        beats.push({
          time,
          confidence
        });
      }
    }
    
    previousFlux = currentFlux;
    
    // Report progress
    if (i % (hopSize * 20) === 0) {
      const progress = i / channelData.length;
      ctx.postMessage({
        type: WorkerResponseType.PROGRESS_UPDATE,
        progress
      });
    }
  }
  
  // Filter out beats that are too close together (debounce)
  const minTimeBetweenBeats = 0.1; // seconds
  const filteredBeats = beats.filter((beat, index) => {
    if (index === 0) return true;
    return beat.time - beats[index - 1].time >= minTimeBetweenBeats;
  });
  
  return filteredBeats;
}

/**
 * Extract energy samples from audio buffer
 */
function extractEnergySamples(audioBuffer: AudioBuffer, options: any = {}): EnergySample[] {
  const { resolution = 200 } = options;
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const samples: EnergySample[] = [];
  
  // Frame size for energy calculation
  const frameSize = Math.floor(channelData.length / resolution);
  
  for (let i = 0; i < resolution; i++) {
    const startIndex = i * frameSize;
    const endIndex = Math.min(startIndex + frameSize, channelData.length);
    
    // Calculate RMS energy for this frame
    let sumSquares = 0;
    for (let j = startIndex; j < endIndex; j++) {
      sumSquares += channelData[j] * channelData[j];
    }
    
    const rms = Math.sqrt(sumSquares / (endIndex - startIndex));
    const time = startIndex / sampleRate;
    
    samples.push({
      time,
      level: rms
    });
    
    // Report progress
    if (i % 20 === 0) {
      const progress = i / resolution;
      ctx.postMessage({
        type: WorkerResponseType.PROGRESS_UPDATE,
        progress
      });
    }
  }
  
  // Normalize energy levels to 0-1 range
  const maxEnergy = Math.max(...samples.map(s => s.level));
  if (maxEnergy > 0) {
    samples.forEach(sample => {
      sample.level = sample.level / maxEnergy;
    });
  }
  
  return samples;
}

/**
 * Analyze audio sections based on energy and spectral changes
 */
function analyzeSections(audioBuffer: AudioBuffer, beats: Beat[], options: any = {}): Section[] {
  const { minSectionDuration = 5, maxSections = 10 } = options;
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const sections: Section[] = [];
  
  // Use Meyda to extract spectral features
  const frameSize = 4096;
  const hopSize = 2048;
  const frames = Math.floor((audioBuffer.length - frameSize) / hopSize) + 1;
  
  // Extract spectral features for each frame
  const spectralFeatures: any[] = [];
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < frames; i++) {
    const frameStart = i * hopSize;
    const frame = channelData.slice(frameStart, frameStart + frameSize);
    
    const features = Meyda.extract([
      'spectralCentroid',
      'spectralFlatness',
      'spectralRolloff',
      'rms'
    ], frame);
    
    spectralFeatures.push({
      time: frameStart / sampleRate,
      ...features
    });
    
    // Report progress
    if (i % 20 === 0) {
      const progress = i / frames;
      ctx.postMessage({
        type: WorkerResponseType.PROGRESS_UPDATE,
        progress
      });
    }
  }
  
  // Detect significant changes in spectral features
  const changes: number[] = [];
  const changeThreshold = 0.15;
  
  for (let i = 1; i < spectralFeatures.length; i++) {
    const prev = spectralFeatures[i - 1];
    const curr = spectralFeatures[i];
    
    // Calculate normalized difference for each feature
    const centroidDiff = Math.abs(curr.spectralCentroid - prev.spectralCentroid) / 
                         (Math.max(curr.spectralCentroid, prev.spectralCentroid) || 1);
    const flatnessDiff = Math.abs(curr.spectralFlatness - prev.spectralFlatness) / 
                         (Math.max(curr.spectralFlatness, prev.spectralFlatness) || 1);
    const rolloffDiff = Math.abs(curr.spectralRolloff - prev.spectralRolloff) / 
                        (Math.max(curr.spectralRolloff, prev.spectralRolloff) || 1);
    const rmsDiff = Math.abs(curr.rms - prev.rms) / 
                    (Math.max(curr.rms, prev.rms) || 1);
    
    // Weighted sum of differences
    const totalDiff = (centroidDiff * 0.3) + (flatnessDiff * 0.2) + (rolloffDiff * 0.2) + (rmsDiff * 0.3);
    
    if (totalDiff > changeThreshold) {
      changes.push(curr.time);
    }
  }
  
  // Filter changes to ensure minimum section duration
  const filteredChanges = [0]; // Start with beginning of track
  
  for (let i = 0; i < changes.length; i++) {
    const lastChange = filteredChanges[filteredChanges.length - 1];
    if (changes[i] - lastChange >= minSectionDuration) {
      filteredChanges.push(changes[i]);
    }
  }
  
  // Add end of track
  if (filteredChanges[filteredChanges.length - 1] < duration - minSectionDuration) {
    filteredChanges.push(duration);
  } else {
    filteredChanges[filteredChanges.length - 1] = duration;
  }
  
  // Limit number of sections if needed
  if (filteredChanges.length > maxSections + 1) {
    // Keep start and end points, and select evenly spaced points in between
    const start = filteredChanges[0];
    const end = filteredChanges[filteredChanges.length - 1];
    const newChanges = [start];
    
    for (let i = 1; i <= maxSections - 1; i++) {
      const index = Math.floor((i * (filteredChanges.length - 2)) / (maxSections - 1)) + 1;
      newChanges.push(filteredChanges[index]);
    }
    
    newChanges.push(end);
    filteredChanges.length = 0;
    filteredChanges.push(...newChanges);
  }
  
  // Create sections from change points
  for (let i = 0; i < filteredChanges.length - 1; i++) {
    const start = filteredChanges[i];
    const end = filteredChanges[i + 1];
    
    // Calculate average energy in this section
    const sectionFeatures = spectralFeatures.filter(f => f.time >= start && f.time < end);
    const avgEnergy = sectionFeatures.reduce((sum, f) => sum + f.rms, 0) / sectionFeatures.length;
    
    // Determine section label based on position and energy
    let label = 'section';
    if (i === 0) label = 'intro';
    else if (i === filteredChanges.length - 2) label = 'outro';
    else if (avgEnergy > 0.7) label = 'chorus';
    else if (avgEnergy > 0.4) label = 'verse';
    else label = 'bridge';
    
    sections.push({
      start,
      duration: end - start,
      label,
      confidence: 0.7, // Default confidence
      characteristics: {
        energy: avgEnergy
      }
    });
  }
  
  return sections;
}

/**
 * Calculate tempo from beats
 */
function calculateTempo(beats: Beat[]): number {
  if (beats.length < 2) return 120; // Default tempo if not enough beats
  
  // Calculate time differences between consecutive beats
  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i].time - beats[i - 1].time);
  }
  
  // Filter out outliers (intervals that are too short or too long)
  const filteredIntervals = intervals.filter(interval => 
    interval >= 0.2 && interval <= 1.0
  );
  
  if (filteredIntervals.length === 0) return 120;
  
  // Calculate average interval
  const avgInterval = filteredIntervals.reduce((sum, val) => sum + val, 0) / filteredIntervals.length;
  
  // Convert to BPM
  const bpm = 60 / avgInterval;
  
  // Round to nearest integer
  return Math.round(bpm);
}

/**
 * Process audio analysis tasks
 */
ctx.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { type, audioData, sampleRate = 44100, options = {} } = event.data;
  
  try {
    // Create audio buffer if needed
    let audioBuffer: AudioBuffer;
    
    if (audioData instanceof Float32Array) {
      // Create an audio buffer from the Float32Array
      audioContext = new OfflineAudioContext(1, audioData.length, sampleRate);
      audioBuffer = audioContext.createBuffer(1, audioData.length, sampleRate);
      audioBuffer.getChannelData(0).set(audioData);
    } else if (audioData instanceof AudioBuffer) {
      audioBuffer = audioData;
    } else {
      throw new Error('Invalid audio data format');
    }
    
    switch (type) {
      case WorkerTaskType.EXTRACT_WAVEFORM: {
        const waveform = extractWaveform(audioBuffer, options.resolution);
        ctx.postMessage({
          type: WorkerResponseType.WAVEFORM_READY,
          data: {
            samples: waveform,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            maxAmplitude: Math.max(...waveform)
          }
        });
        break;
      }
      
      case WorkerTaskType.DETECT_BEATS: {
        const beats = detectBeats(audioBuffer, options);
        const tempo = calculateTempo(beats);
        ctx.postMessage({
          type: WorkerResponseType.BEATS_DETECTED,
          data: {
            beats,
            tempo,
            timeSignature: { numerator: 4, denominator: 4 }, // Default time signature
            confidence: 0.8 // Default confidence
          }
        });
        break;
      }
      
      case WorkerTaskType.EXTRACT_FEATURES: {
        const energySamples = extractEnergySamples(audioBuffer, options);
        const averageEnergy = energySamples.reduce((sum, sample) => sum + sample.level, 0) / energySamples.length;
        const peakEnergy = Math.max(...energySamples.map(s => s.level));
        const peakEnergyTime = energySamples.find(s => s.level === peakEnergy)?.time || 0;
        
        ctx.postMessage({
          type: WorkerResponseType.FEATURES_EXTRACTED,
          data: {
            samples: energySamples,
            averageEnergy,
            peakEnergy,
            peakEnergyTime
          }
        });
        break;
      }
      
      case WorkerTaskType.ANALYZE_SECTIONS: {
        const beats = options.beats || [];
        const sections = analyzeSections(audioBuffer, beats, options);
        ctx.postMessage({
          type: WorkerResponseType.SECTIONS_ANALYZED,
          data: {
            sections
          }
        });
        break;
      }
      
      case WorkerTaskType.ANALYZE_AUDIO: {
        // Extract waveform
        const waveform = extractWaveform(audioBuffer, options.waveformResolution || 1000);
        
        // Detect beats
        const beats = detectBeats(audioBuffer, options);
        const tempo = calculateTempo(beats);
        
        // Extract energy features
        const energySamples = extractEnergySamples(audioBuffer, options);
        const averageEnergy = energySamples.reduce((sum, sample) => sum + sample.level, 0) / energySamples.length;
        const peakEnergy = Math.max(...energySamples.map(s => s.level));
        const peakEnergyTime = energySamples.find(s => s.level === peakEnergy)?.time || 0;
        
        // Analyze sections
        const sections = analyzeSections(audioBuffer, beats, options);
        
        // Compile complete analysis
        ctx.postMessage({
          type: WorkerResponseType.ANALYSIS_COMPLETE,
          data: {
            metadata: {
              duration: audioBuffer.duration,
              analyzedAt: new Date()
            },
            waveform: {
              data: Array.from(waveform),
              sampleRate: audioBuffer.sampleRate,
              channels: audioBuffer.numberOfChannels,
              maxAmplitude: Math.max(...waveform),
              minAmplitude: 0
            },
            beats: {
              beats,
              averageConfidence: beats.reduce((sum, beat) => sum + beat.confidence, 0) / beats.length
            },
            tempo: {
              bpm: tempo,
              timeSignature: { numerator: 4, denominator: 4 },
              confidence: 0.8,
              isStable: true
            },
            energy: {
              samples: energySamples,
              averageEnergy,
              peakEnergy,
              peakEnergyTime
            },
            sections: {
              sections
            }
          }
        });
        break;
      }
      
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  } catch (error) {
    ctx.postMessage({
      type: WorkerResponseType.ERROR,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Signal that the worker is ready
ctx.postMessage({ type: WorkerResponseType.PROGRESS_UPDATE, progress: 0 });
