// src/utils/audioSync.ts

/**
 * Utility functions for audio synchronization and beat detection
 */

/**
 * Calculates the nearest beat position based on BPM
 * @param currentTime Current playback time in seconds
 * @param bpm Beats per minute
 * @param offset Optional offset in seconds
 * @returns Time of the nearest beat in seconds
 */
export function getNearestBeatTime(currentTime: number, bpm: number, offset: number = 0): number {
  if (bpm <= 0) return currentTime;
  
  // Calculate beat duration in seconds
  const beatDuration = 60 / bpm;
  
  // Calculate how many beats have passed since the offset
  const beatsElapsed = (currentTime - offset) / beatDuration;
  
  // Round to the nearest beat
  const nearestBeat = Math.round(beatsElapsed);
  
  // Calculate the time of the nearest beat
  return offset + (nearestBeat * beatDuration);
}

/**
 * Detects if the current time is on a beat
 * @param currentTime Current playback time in seconds
 * @param bpm Beats per minute
 * @param offset Optional offset in seconds
 * @param tolerance Tolerance in seconds (default: 0.05)
 * @returns True if the current time is on a beat
 */
export function isOnBeat(currentTime: number, bpm: number, offset: number = 0, tolerance: number = 0.05): boolean {
  if (bpm <= 0) return false;
  
  // Calculate beat duration in seconds
  const beatDuration = 60 / bpm;
  
  // Calculate how many beats have passed since the offset
  const beatsElapsed = (currentTime - offset) / beatDuration;
  
  // Calculate the distance to the nearest beat
  const nearestBeat = Math.round(beatsElapsed);
  const distanceToBeat = Math.abs(beatsElapsed - nearestBeat) * beatDuration;
  
  // Check if we're within the tolerance
  return distanceToBeat <= tolerance;
}

/**
 * Calculates the next beat time based on BPM
 * @param currentTime Current playback time in seconds
 * @param bpm Beats per minute
 * @param offset Optional offset in seconds
 * @returns Time of the next beat in seconds
 */
export function getNextBeatTime(currentTime: number, bpm: number, offset: number = 0): number {
  if (bpm <= 0) return currentTime;
  
  // Calculate beat duration in seconds
  const beatDuration = 60 / bpm;
  
  // Calculate how many beats have passed since the offset
  const beatsElapsed = (currentTime - offset) / beatDuration;
  
  // Calculate the next beat
  const nextBeat = Math.ceil(beatsElapsed);
  
  // Calculate the time of the next beat
  return offset + (nextBeat * beatDuration);
}

/**
 * Calculates the previous beat time based on BPM
 * @param currentTime Current playback time in seconds
 * @param bpm Beats per minute
 * @param offset Optional offset in seconds
 * @returns Time of the previous beat in seconds
 */
export function getPreviousBeatTime(currentTime: number, bpm: number, offset: number = 0): number {
  if (bpm <= 0) return currentTime;
  
  // Calculate beat duration in seconds
  const beatDuration = 60 / bpm;
  
  // Calculate how many beats have passed since the offset
  const beatsElapsed = (currentTime - offset) / beatDuration;
  
  // Calculate the previous beat
  const previousBeat = Math.floor(beatsElapsed);
  
  // Calculate the time of the previous beat
  return offset + (previousBeat * beatDuration);
}

/**
 * Calculates the beat position (0 to 1) within the current measure
 * @param currentTime Current playback time in seconds
 * @param bpm Beats per minute
 * @param beatsPerMeasure Number of beats per measure (default: 4)
 * @param offset Optional offset in seconds
 * @returns Position within the measure (0 to 1)
 */
export function getMeasurePosition(
  currentTime: number, 
  bpm: number, 
  beatsPerMeasure: number = 4, 
  offset: number = 0
): number {
  if (bpm <= 0) return 0;
  
  // Calculate beat duration in seconds
  const beatDuration = 60 / bpm;
  
  // Calculate how many beats have passed since the offset
  const beatsElapsed = (currentTime - offset) / beatDuration;
  
  // Calculate the position within the measure
  return (beatsElapsed % beatsPerMeasure) / beatsPerMeasure;
}

/**
 * Detects beats in an audio buffer
 * @param audioBuffer The audio buffer to analyze
 * @param sensitivity Sensitivity of beat detection (0-1, default: 0.5)
 * @returns Array of beat times in seconds
 */
export async function detectBeats(audioBuffer: AudioBuffer, sensitivity: number = 0.5): Promise<number[]> {
  // This is a simplified beat detection algorithm
  // In a real app, you would use a more sophisticated algorithm
  
  const beats: number[] = [];
  const threshold = 0.1 + (sensitivity * 0.4); // Adjust threshold based on sensitivity
  
  // Get the audio data
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Calculate the window size (50ms)
  const windowSize = Math.floor(sampleRate * 0.05);
  
  // Calculate energy for each window
  let prevEnergy = 0;
  for (let i = 0; i < channelData.length; i += windowSize) {
    let energy = 0;
    
    // Calculate energy for this window
    for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
      energy += Math.abs(channelData[i + j]);
    }
    
    energy /= windowSize;
    
    // Check if this is a beat (energy spike)
    if (energy > prevEnergy * (1 + threshold) && energy > 0.01) {
      const beatTime = i / sampleRate;
      beats.push(beatTime);
    }
    
    prevEnergy = energy;
  }
  
  return beats;
}

/**
 * Estimates the BPM of an audio buffer
 * @param audioBuffer The audio buffer to analyze
 * @returns Estimated BPM
 */
export async function estimateBPM(audioBuffer: AudioBuffer): Promise<number> {
  // Detect beats
  const beats = await detectBeats(audioBuffer);
  
  if (beats.length < 2) {
    return 120; // Default BPM if we can't detect enough beats
  }
  
  // Calculate intervals between beats
  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i] - beats[i - 1]);
  }
  
  // Calculate the median interval
  intervals.sort((a: any, b: any) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  
  // Convert to BPM
  const bpm = 60 / medianInterval;
  
  // Round to nearest integer and ensure it's in a reasonable range
  return Math.max(60, Math.min(200, Math.round(bpm)));
}
