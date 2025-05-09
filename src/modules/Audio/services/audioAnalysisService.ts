/**
 * Audio Analysis Service
 * 
 * This service provides an interface for audio analysis operations,
 * managing Web Workers for intensive processing tasks and exposing
 * a clean API for React components.
 */

import { EventEmitter } from 'events';
import { AudioAnalysis } from '../../../types/AudioAnalysis';
import { WorkerTaskType, WorkerResponseType } from '../workers/audioAnalysisWorker';

// Define service event types
export enum AudioServiceEvents {
  ANALYSIS_STARTED = 'analysis-started',
  ANALYSIS_PROGRESS = 'analysis-progress',
  ANALYSIS_COMPLETE = 'analysis-complete',
  ANALYSIS_ERROR = 'analysis-error',
  WAVEFORM_READY = 'waveform-ready',
  BEATS_DETECTED = 'beats-detected',
  FEATURES_EXTRACTED = 'features-extracted',
  SECTIONS_ANALYZED = 'sections-analyzed'
}

// Service configuration options
export interface AudioAnalysisOptions {
  waveformResolution?: number;
  beatDetectionSensitivity?: number;
  minBeatConfidence?: number;
  energyResolution?: number;
  minSectionDuration?: number;
  maxSections?: number;
}

// Default options
const DEFAULT_OPTIONS: AudioAnalysisOptions = {
  waveformResolution: 1000,
  beatDetectionSensitivity: 1.5,
  minBeatConfidence: 0.5,
  energyResolution: 200,
  minSectionDuration: 5,
  maxSections: 10
};

/**
 * Service for audio analysis operations
 */
class AudioAnalysisService extends EventEmitter {
  private worker: Worker | null = null;
  private audioContext: AudioContext | null = null;
  private isAnalyzing: boolean = false;
  private options: AudioAnalysisOptions;
  
  constructor(options: AudioAnalysisOptions = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initAudioContext();
  }
  
  /**
   * Initialize the Web Audio API context
   */
  private initAudioContext(): void {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  
  /**
   * Initialize the audio analysis worker
   */
  private initWorker(): void {
    if (this.worker) {
      this.worker.terminate();
    }
    
    // Create a new worker
    this.worker = new Worker(
      new URL('../workers/audioAnalysisWorker.ts', import.meta.url),
      { type: 'module' }
    );
    
    // Set up worker message handling
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);
  }
  
  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const { type, data, progress, error } = event.data;
    
    switch (type) {
      case WorkerResponseType.ANALYSIS_COMPLETE:
        this.isAnalyzing = false;
        this.emit(AudioServiceEvents.ANALYSIS_COMPLETE, data);
        break;
        
      case WorkerResponseType.WAVEFORM_READY:
        this.emit(AudioServiceEvents.WAVEFORM_READY, data);
        break;
        
      case WorkerResponseType.BEATS_DETECTED:
        this.emit(AudioServiceEvents.BEATS_DETECTED, data);
        break;
        
      case WorkerResponseType.FEATURES_EXTRACTED:
        this.emit(AudioServiceEvents.FEATURES_EXTRACTED, data);
        break;
        
      case WorkerResponseType.SECTIONS_ANALYZED:
        this.emit(AudioServiceEvents.SECTIONS_ANALYZED, data);
        break;
        
      case WorkerResponseType.PROGRESS_UPDATE:
        this.emit(AudioServiceEvents.ANALYSIS_PROGRESS, progress);
        break;
        
      case WorkerResponseType.ERROR:
        this.isAnalyzing = false;
        this.emit(AudioServiceEvents.ANALYSIS_ERROR, error);
        break;
    }
  }
  
  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    this.isAnalyzing = false;
    this.emit(AudioServiceEvents.ANALYSIS_ERROR, error.message);
  }
  
  /**
   * Load audio from a file or URL
   */
  async loadAudio(source: File | string): Promise<AudioBuffer> {
    this.initAudioContext();
    
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }
    
    let arrayBuffer: ArrayBuffer;
    
    if (typeof source === 'string') {
      // Load from URL
      const response = await fetch(source);
      arrayBuffer = await response.arrayBuffer();
    } else {
      // Load from File
      arrayBuffer = await source.arrayBuffer();
    }
    
    return this.audioContext.decodeAudioData(arrayBuffer);
  }
  
  /**
   * Analyze audio from a file or URL
   */
  async analyzeAudio(source: File | string | AudioBuffer, options: AudioAnalysisOptions = {}): Promise<AudioAnalysis> {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }
    
    this.isAnalyzing = true;
    this.emit(AudioServiceEvents.ANALYSIS_STARTED);
    
    try {
      // Initialize worker
      this.initWorker();
      
      if (!this.worker) {
        throw new Error('Worker initialization failed');
      }
      
      // Load audio if needed
      let audioBuffer: AudioBuffer;
      if (source instanceof AudioBuffer) {
        audioBuffer = source;
      } else {
        audioBuffer = await this.loadAudio(source);
      }
      
      // Merge options
      const mergedOptions = { ...this.options, ...options };
      
      // Create a promise to wait for analysis completion
      return new Promise<AudioAnalysis>((resolve, reject) => {
        const onComplete = (result: AudioAnalysis) => {
          this.removeListener(AudioServiceEvents.ANALYSIS_COMPLETE, onComplete);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          resolve(result);
        };
        
        const onError = (error: string) => {
          this.removeListener(AudioServiceEvents.ANALYSIS_COMPLETE, onComplete);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          reject(new Error(error));
        };
        
        this.once(AudioServiceEvents.ANALYSIS_COMPLETE, onComplete);
        this.once(AudioServiceEvents.ANALYSIS_ERROR, onError);
        
        // Start analysis
        this.worker!.postMessage({
          type: WorkerTaskType.ANALYZE_AUDIO,
          audioData: audioBuffer,
          sampleRate: audioBuffer.sampleRate,
          options: mergedOptions
        });
      });
    } catch (error) {
      this.isAnalyzing = false;
      this.emit(AudioServiceEvents.ANALYSIS_ERROR, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Extract waveform data from audio
   */
  async extractWaveform(source: File | string | AudioBuffer, resolution = 1000): Promise<any> {
    try {
      // Initialize worker
      this.initWorker();
      
      if (!this.worker) {
        throw new Error('Worker initialization failed');
      }
      
      // Load audio if needed
      let audioBuffer: AudioBuffer;
      if (source instanceof AudioBuffer) {
        audioBuffer = source;
      } else {
        audioBuffer = await this.loadAudio(source);
      }
      
      // Create a promise to wait for waveform extraction
      return new Promise<any>((resolve, reject) => {
        const onWaveformReady = (data: any) => {
          this.removeListener(AudioServiceEvents.WAVEFORM_READY, onWaveformReady);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          resolve(data);
        };
        
        const onError = (error: string) => {
          this.removeListener(AudioServiceEvents.WAVEFORM_READY, onWaveformReady);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          reject(new Error(error));
        };
        
        this.once(AudioServiceEvents.WAVEFORM_READY, onWaveformReady);
        this.once(AudioServiceEvents.ANALYSIS_ERROR, onError);
        
        // Start waveform extraction
        this.worker!.postMessage({
          type: WorkerTaskType.EXTRACT_WAVEFORM,
          audioData: audioBuffer,
          sampleRate: audioBuffer.sampleRate,
          options: { resolution }
        });
      });
    } catch (error) {
      this.emit(AudioServiceEvents.ANALYSIS_ERROR, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Detect beats in audio
   */
  async detectBeats(source: File | string | AudioBuffer, options: any = {}): Promise<any> {
    try {
      // Initialize worker
      this.initWorker();
      
      if (!this.worker) {
        throw new Error('Worker initialization failed');
      }
      
      // Load audio if needed
      let audioBuffer: AudioBuffer;
      if (source instanceof AudioBuffer) {
        audioBuffer = source;
      } else {
        audioBuffer = await this.loadAudio(source);
      }
      
      // Create a promise to wait for beat detection
      return new Promise<any>((resolve, reject) => {
        const onBeatsDetected = (data: any) => {
          this.removeListener(AudioServiceEvents.BEATS_DETECTED, onBeatsDetected);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          resolve(data);
        };
        
        const onError = (error: string) => {
          this.removeListener(AudioServiceEvents.BEATS_DETECTED, onBeatsDetected);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          reject(new Error(error));
        };
        
        this.once(AudioServiceEvents.BEATS_DETECTED, onBeatsDetected);
        this.once(AudioServiceEvents.ANALYSIS_ERROR, onError);
        
        // Start beat detection
        this.worker!.postMessage({
          type: WorkerTaskType.DETECT_BEATS,
          audioData: audioBuffer,
          sampleRate: audioBuffer.sampleRate,
          options: {
            minConfidence: options.minConfidence || this.options.minBeatConfidence,
            sensitivity: options.sensitivity || this.options.beatDetectionSensitivity
          }
        });
      });
    } catch (error) {
      this.emit(AudioServiceEvents.ANALYSIS_ERROR, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Extract audio features
   */
  async extractFeatures(source: File | string | AudioBuffer, options: any = {}): Promise<any> {
    try {
      // Initialize worker
      this.initWorker();
      
      if (!this.worker) {
        throw new Error('Worker initialization failed');
      }
      
      // Load audio if needed
      let audioBuffer: AudioBuffer;
      if (source instanceof AudioBuffer) {
        audioBuffer = source;
      } else {
        audioBuffer = await this.loadAudio(source);
      }
      
      // Create a promise to wait for feature extraction
      return new Promise<any>((resolve, reject) => {
        const onFeaturesExtracted = (data: any) => {
          this.removeListener(AudioServiceEvents.FEATURES_EXTRACTED, onFeaturesExtracted);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          resolve(data);
        };
        
        const onError = (error: string) => {
          this.removeListener(AudioServiceEvents.FEATURES_EXTRACTED, onFeaturesExtracted);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          reject(new Error(error));
        };
        
        this.once(AudioServiceEvents.FEATURES_EXTRACTED, onFeaturesExtracted);
        this.once(AudioServiceEvents.ANALYSIS_ERROR, onError);
        
        // Start feature extraction
        this.worker!.postMessage({
          type: WorkerTaskType.EXTRACT_FEATURES,
          audioData: audioBuffer,
          sampleRate: audioBuffer.sampleRate,
          options: {
            resolution: options.resolution || this.options.energyResolution
          }
        });
      });
    } catch (error) {
      this.emit(AudioServiceEvents.ANALYSIS_ERROR, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Analyze audio sections
   */
  async analyzeSections(source: File | string | AudioBuffer, beats: any[] = [], options: any = {}): Promise<any> {
    try {
      // Initialize worker
      this.initWorker();
      
      if (!this.worker) {
        throw new Error('Worker initialization failed');
      }
      
      // Load audio if needed
      let audioBuffer: AudioBuffer;
      if (source instanceof AudioBuffer) {
        audioBuffer = source;
      } else {
        audioBuffer = await this.loadAudio(source);
      }
      
      // Create a promise to wait for section analysis
      return new Promise<any>((resolve, reject) => {
        const onSectionsAnalyzed = (data: any) => {
          this.removeListener(AudioServiceEvents.SECTIONS_ANALYZED, onSectionsAnalyzed);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          resolve(data);
        };
        
        const onError = (error: string) => {
          this.removeListener(AudioServiceEvents.SECTIONS_ANALYZED, onSectionsAnalyzed);
          this.removeListener(AudioServiceEvents.ANALYSIS_ERROR, onError);
          reject(new Error(error));
        };
        
        this.once(AudioServiceEvents.SECTIONS_ANALYZED, onSectionsAnalyzed);
        this.once(AudioServiceEvents.ANALYSIS_ERROR, onError);
        
        // Start section analysis
        this.worker!.postMessage({
          type: WorkerTaskType.ANALYZE_SECTIONS,
          audioData: audioBuffer,
          sampleRate: audioBuffer.sampleRate,
          options: {
            beats,
            minSectionDuration: options.minSectionDuration || this.options.minSectionDuration,
            maxSections: options.maxSections || this.options.maxSections
          }
        });
      });
    } catch (error) {
      this.emit(AudioServiceEvents.ANALYSIS_ERROR, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Cancel ongoing analysis
   */
  cancelAnalysis(): void {
    if (this.worker && this.isAnalyzing) {
      this.worker.terminate();
      this.worker = null;
      this.isAnalyzing = false;
      this.emit(AudioServiceEvents.ANALYSIS_ERROR, 'Analysis cancelled');
    }
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.removeAllListeners();
  }
}

// Create and export a singleton instance
const audioAnalysisService = new AudioAnalysisService();
export default audioAnalysisService;
