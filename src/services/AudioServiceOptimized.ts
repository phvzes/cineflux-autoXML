// src/services/AudioServiceOptimized.ts
import { 
  AudioAnalysis, 
  Beat, 
  BeatAnalysis, 
  Tempo, 
  Waveform, 
  EnergyAnalysis, 
  EnergySample 
} from '../types/AudioAnalysis';
import workerManager, { WorkerType } from '../utils/workerManager';
import { AudioWorkerMessageType } from '../workers/audioWorker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Error class for audio processing errors
 */
export class AudioProcessingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AudioProcessingError';
  }
}

/**
 * Service for audio analysis and processing
 * Optimized version that uses Web Workers for CPU-intensive tasks
 */
class AudioServiceOptimized {
  // Singleton instance
  private static instance: AudioServiceOptimized;
  
  // Memory management
  private audioBufferCache: Map<string, {
    buffer: AudioBuffer;
    lastAccessed: number;
    size: number;
  }> = new Map();
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private currentCacheSize = 0;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Set up periodic cache cleanup
    setInterval(() => this.cleanupCache(), 60000); // Clean up every minute
  }

  /**
   * Get the singleton instance of AudioServiceOptimized
   * @returns The AudioServiceOptimized instance
   */
  public static getInstance(): AudioServiceOptimized {
    if (!AudioServiceOptimized.instance) {
      AudioServiceOptimized.instance = new AudioServiceOptimized();
    }
    return AudioServiceOptimized.instance;
  }

  /**
   * Load an audio file and return an AudioBuffer
   * @param source Audio file or URL to load
   * @param progressCallback Optional callback for loading progress
   * @returns Promise resolving to an AudioBuffer
   */
  async loadAudio(
    source: File | string,
    progressCallback?: (progress: number, step: string) => void
  ): Promise<AudioBuffer> {
    try {
      // Generate cache key for the source
      const cacheKey = typeof source === 'string' 
        ? source 
        : `${source.name}-${source.size}-${source.lastModified}`;
      
      // Check if we have this audio in cache
      if (this.audioBufferCache.has(cacheKey)) {
        const cached = this.audioBufferCache.get(cacheKey)!;
        cached.lastAccessed = Date.now();
        progressCallback?.(100, 'Loaded from cache');
        return cached.buffer;
      }
      
      // Report initial progress
      progressCallback?.(0, 'Initializing audio context...');
      
      // Create an audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      let arrayBuffer: ArrayBuffer;
      
      // Handle different source types
      if (typeof source === 'string') {
        // Load from URL using worker
        const result = await workerManager.executeTask(
          WorkerType.AUDIO,
          AudioWorkerMessageType.LOAD_AUDIO,
          { url: source },
          (progress) => {
            progressCallback?.(progress.progress * 100, progress.stage || 'Loading audio...');
          }
        );
        
        // We can't transfer AudioBuffer directly from worker, so we need to recreate it
        arrayBuffer = result._rawData.buffer;
      } else {
        // Load from File object
        progressCallback?.(10, 'Reading audio file...');
        arrayBuffer = await source.arrayBuffer();
        progressCallback?.(40, 'Audio file loaded, decoding...');
      }
      
      // Decode the audio data
      progressCallback?.(80, 'Decoding audio data...');
      
      // Use a promise to handle the decodeAudioData callback
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => resolve(buffer),
          (error) => reject(new AudioProcessingError(`Failed to decode audio: ${error}`, 'DECODE_ERROR'))
        );
      });
      
      progressCallback?.(100, 'Audio loaded successfully');
      
      // Close the audio context
      if (audioContext.state !== 'closed') {
        await audioContext.close();
      }
      
      // Cache the audio buffer
      const bufferSize = arrayBuffer.byteLength;
      this.cacheAudioBuffer(cacheKey, audioBuffer, bufferSize);
      
      return audioBuffer;
    } catch (error) {
      if (error instanceof AudioProcessingError) {
        throw error;
      }
      
      throw new AudioProcessingError(
        `Error loading audio: ${error instanceof Error ? error.message : String(error)}`,
        'LOAD_ERROR'
      );
    }
  }
  
  /**
   * Analyze an audio file to detect beats, segments, and energy levels
   * @param audioFile The audio file to analyze
   * @param progressCallback Callback function to report progress
   * @returns Promise resolving to the analysis results
   */
  async analyzeAudio(
    audioFile: File,
    progressCallback: (progress: number, step: string) => void
  ): Promise<AudioAnalysis> {
    try {
      // Use the worker to perform the analysis
      return await workerManager.executeTask<AudioAnalysis>(
        WorkerType.AUDIO,
        AudioWorkerMessageType.ANALYZE_AUDIO,
        { audioFile },
        (progress) => {
          progressCallback(progress.progress * 100, progress.stage || 'Analyzing audio...');
        }
      );
    } catch (error) {
      console.error('Error analyzing audio:', error);
      
      throw new AudioProcessingError(
        `Error analyzing audio: ${error instanceof Error ? error.message : String(error)}`,
        'ANALYSIS_ERROR'
      );
    }
  }
  
  /**
   * Extract waveform data from an audio buffer
   * @param audioBuffer The audio buffer to analyze
   * @param progressCallback Optional callback for progress updates
   * @returns Promise resolving to waveform data
   */
  async extractWaveform(
    audioBuffer: AudioBuffer,
    progressCallback?: (progress: number) => void
  ): Promise<Waveform> {
    return workerManager.executeTask<Waveform>(
      WorkerType.AUDIO,
      AudioWorkerMessageType.EXTRACT_WAVEFORM,
      { audioBuffer },
      (progress) => {
        progressCallback?.(progress * 100);
      }
    );
  }
  
  /**
   * Detect beats in an audio buffer
   * @param audioBuffer The audio buffer to analyze
   * @param progressCallback Optional callback for progress updates
   * @returns Promise resolving to beat analysis data
   */
  async detectBeats(
    audioBuffer: AudioBuffer,
    progressCallback?: (progress: number) => void
  ): Promise<BeatAnalysis> {
    return workerManager.executeTask<BeatAnalysis>(
      WorkerType.AUDIO,
      AudioWorkerMessageType.DETECT_BEATS,
      { audioBuffer },
      (progress) => {
        progressCallback?.(progress * 100);
      }
    );
  }
  
  /**
   * Analyze energy levels in an audio buffer
   * @param audioBuffer The audio buffer to analyze
   * @param progressCallback Optional callback for progress updates
   * @returns Promise resolving to energy analysis data
   */
  async analyzeEnergy(
    audioBuffer: AudioBuffer,
    progressCallback?: (progress: number) => void
  ): Promise<EnergyAnalysis> {
    return workerManager.executeTask<EnergyAnalysis>(
      WorkerType.AUDIO,
      AudioWorkerMessageType.ANALYZE_ENERGY,
      { audioBuffer },
      (progress) => {
        progressCallback?.(progress * 100);
      }
    );
  }
  
  /**
   * Estimate tempo from beat data
   * @param beats Array of detected beats
   * @param duration Duration of the audio in seconds
   * @returns Promise resolving to tempo information
   */
  async estimateTempo(beats: Beat[], duration: number): Promise<Tempo> {
    return workerManager.executeTask<Tempo>(
      WorkerType.AUDIO,
      AudioWorkerMessageType.ESTIMATE_TEMPO,
      { beats, duration }
    );
  }
  
  /**
   * Detect sections in the audio based on energy and beat analysis
   * @param energyAnalysis Energy analysis data
   * @param beatAnalysis Beat analysis data
   * @param duration Duration of the audio in seconds
   * @returns Promise resolving to section analysis data
   */
  async detectSections(
    energyAnalysis: EnergyAnalysis,
    beatAnalysis: BeatAnalysis,
    duration: number
  ): Promise<any> {
    return workerManager.executeTask(
      WorkerType.AUDIO,
      AudioWorkerMessageType.DETECT_SECTIONS,
      { energyAnalysis, beatAnalysis, duration }
    );
  }
  
  /**
   * Extract the BPM (beats per minute) from an audio file
   * @param audioFile The audio file to analyze
   * @returns Promise resolving to the BPM and beat times
   */
  async extractBPM(audioFile: File): Promise<{ bpm: number; beats: number[] }> {
    return workerManager.executeTask(
      WorkerType.AUDIO,
      AudioWorkerMessageType.EXTRACT_BPM,
      { audioFile }
    );
  }
  
  /**
   * Create a waveform visualization for an audio file
   * @param audioFile The audio file to visualize
   * @param width The width of the visualization in pixels
   * @param height The height of the visualization in pixels
   * @returns Promise resolving to an array of amplitude values
   */
  async createWaveform(audioFile: File, width: number, height: number): Promise<number[]> {
    return workerManager.executeTask(
      WorkerType.AUDIO,
      AudioWorkerMessageType.CREATE_WAVEFORM,
      { audioFile, width, height }
    );
  }
  
  /**
   * Cache an audio buffer
   * @param key Cache key
   * @param buffer AudioBuffer to cache
   * @param size Size of the buffer in bytes
   */
  private cacheAudioBuffer(key: string, buffer: AudioBuffer, size: number): void {
    // Make room in the cache if needed
    while (this.currentCacheSize + size > this.maxCacheSize && this.audioBufferCache.size > 0) {
      this.evictOldestFromCache();
    }
    
    // Add to cache
    this.audioBufferCache.set(key, {
      buffer,
      lastAccessed: Date.now(),
      size
    });
    
    this.currentCacheSize += size;
  }
  
  /**
   * Evict the oldest item from the cache
   */
  private evictOldestFromCache(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, { lastAccessed }] of this.audioBufferCache.entries()) {
      if (lastAccessed < oldestTime) {
        oldestTime = lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const { size } = this.audioBufferCache.get(oldestKey)!;
      this.audioBufferCache.delete(oldestKey);
      this.currentCacheSize -= size;
    }
  }
  
  /**
   * Clean up the cache by removing old items
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [key, { lastAccessed, size }] of this.audioBufferCache.entries()) {
      if (now - lastAccessed > maxAge) {
        this.audioBufferCache.delete(key);
        this.currentCacheSize -= size;
      }
    }
  }
  
  /**
   * Clear the audio buffer cache
   */
  public clearCache(): void {
    this.audioBufferCache.clear();
    this.currentCacheSize = 0;
  }
}

// Export the class
export default AudioServiceOptimized;

// Export the singleton instance
export const audioServiceOptimized = AudioServiceOptimized.getInstance();
