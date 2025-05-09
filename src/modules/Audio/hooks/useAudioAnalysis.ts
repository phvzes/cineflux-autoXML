/**
 * useAudioAnalysis Hook
 * 
 * React hook for audio analysis functionality, providing a clean interface
 * for components to interact with the audio analysis service.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import audioAnalysisService, { 
  AudioServiceEvents, 
  AudioAnalysisOptions 
} from '../services/audioAnalysisService';
import { AudioAnalysis } from '../../../types/AudioAnalysis';

interface UseAudioAnalysisOptions extends AudioAnalysisOptions {
  autoAnalyze?: boolean;
}

interface UseAudioAnalysisResult {
  // Analysis state
  audioBuffer: AudioBuffer | null;
  analysis: AudioAnalysis | null;
  isLoading: boolean;
  progress: number;
  error: string | null;
  
  // Analysis actions
  loadAudio: (source: File | string) => Promise<AudioBuffer>;
  analyzeAudio: (options?: AudioAnalysisOptions) => Promise<AudioAnalysis>;
  extractWaveform: (resolution?: number) => Promise<any>;
  detectBeats: (options?: any) => Promise<any>;
  extractFeatures: (options?: any) => Promise<any>;
  analyzeSections: (beats?: any[], options?: any) => Promise<any>;
  cancelAnalysis: () => void;
  reset: () => void;
}

/**
 * Hook for audio analysis functionality
 */
export function useAudioAnalysis(
  initialSource?: File | string,
  options: UseAudioAnalysisOptions = {}
): UseAudioAnalysisResult {
  // State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const sourceRef = useRef<File | string | null>(initialSource || null);
  const optionsRef = useRef<UseAudioAnalysisOptions>(options);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  /**
   * Set up event listeners for the audio analysis service
   */
  useEffect(() => {
    const handleAnalysisStarted = () => {
      setIsLoading(true);
      setProgress(0);
      setError(null);
    };
    
    const handleAnalysisProgress = (progress: number) => {
      setProgress(progress);
    };
    
    const handleAnalysisComplete = (result: AudioAnalysis) => {
      setAnalysis(result);
      setIsLoading(false);
      setProgress(1);
    };
    
    const handleAnalysisError = (errorMessage: string) => {
      setError(errorMessage);
      setIsLoading(false);
    };
    
    // Add event listeners
    audioAnalysisService.on(AudioServiceEvents.ANALYSIS_STARTED, handleAnalysisStarted);
    audioAnalysisService.on(AudioServiceEvents.ANALYSIS_PROGRESS, handleAnalysisProgress);
    audioAnalysisService.on(AudioServiceEvents.ANALYSIS_COMPLETE, handleAnalysisComplete);
    audioAnalysisService.on(AudioServiceEvents.ANALYSIS_ERROR, handleAnalysisError);
    
    // Clean up event listeners
    return () => {
      audioAnalysisService.off(AudioServiceEvents.ANALYSIS_STARTED, handleAnalysisStarted);
      audioAnalysisService.off(AudioServiceEvents.ANALYSIS_PROGRESS, handleAnalysisProgress);
      audioAnalysisService.off(AudioServiceEvents.ANALYSIS_COMPLETE, handleAnalysisComplete);
      audioAnalysisService.off(AudioServiceEvents.ANALYSIS_ERROR, handleAnalysisError);
    };
  }, []);
  
  /**
   * Load audio from a file or URL
   */
  const loadAudio = useCallback(async (source: File | string): Promise<AudioBuffer> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store the source for later use
      sourceRef.current = source;
      
      // Load the audio
      const buffer = await audioAnalysisService.loadAudio(source);
      setAudioBuffer(buffer);
      setIsLoading(false);
      
      return buffer;
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  /**
   * Analyze audio with the current buffer
   */
  const analyzeAudio = useCallback(async (analysisOptions: AudioAnalysisOptions = {}): Promise<AudioAnalysis> => {
    if (!audioBuffer && !sourceRef.current) {
      const error = new Error('No audio loaded. Call loadAudio first.');
      setError(error.message);
      throw error;
    }
    
    try {
      // Use the current audio buffer or source
      const source = audioBuffer || sourceRef.current!;
      
      // Merge options
      const mergedOptions = { ...optionsRef.current, ...analysisOptions };
      
      // Run the analysis
      const result = await audioAnalysisService.analyzeAudio(source, mergedOptions);
      setAnalysis(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, [audioBuffer]);
  
  /**
   * Extract waveform data
   */
  const extractWaveform = useCallback(async (resolution?: number): Promise<any> => {
    if (!audioBuffer && !sourceRef.current) {
      const error = new Error('No audio loaded. Call loadAudio first.');
      setError(error.message);
      throw error;
    }
    
    try {
      // Use the current audio buffer or source
      const source = audioBuffer || sourceRef.current!;
      
      // Extract waveform
      return await audioAnalysisService.extractWaveform(source, resolution);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, [audioBuffer]);
  
  /**
   * Detect beats in the audio
   */
  const detectBeats = useCallback(async (beatOptions: any = {}): Promise<any> => {
    if (!audioBuffer && !sourceRef.current) {
      const error = new Error('No audio loaded. Call loadAudio first.');
      setError(error.message);
      throw error;
    }
    
    try {
      // Use the current audio buffer or source
      const source = audioBuffer || sourceRef.current!;
      
      // Detect beats
      return await audioAnalysisService.detectBeats(source, beatOptions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, [audioBuffer]);
  
  /**
   * Extract audio features
   */
  const extractFeatures = useCallback(async (featureOptions: any = {}): Promise<any> => {
    if (!audioBuffer && !sourceRef.current) {
      const error = new Error('No audio loaded. Call loadAudio first.');
      setError(error.message);
      throw error;
    }
    
    try {
      // Use the current audio buffer or source
      const source = audioBuffer || sourceRef.current!;
      
      // Extract features
      return await audioAnalysisService.extractFeatures(source, featureOptions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, [audioBuffer]);
  
  /**
   * Analyze audio sections
   */
  const analyzeSections = useCallback(async (beats: any[] = [], sectionOptions: any = {}): Promise<any> => {
    if (!audioBuffer && !sourceRef.current) {
      const error = new Error('No audio loaded. Call loadAudio first.');
      setError(error.message);
      throw error;
    }
    
    try {
      // Use the current audio buffer or source
      const source = audioBuffer || sourceRef.current!;
      
      // Analyze sections
      return await audioAnalysisService.analyzeSections(source, beats, sectionOptions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  }, [audioBuffer]);
  
  /**
   * Cancel ongoing analysis
   */
  const cancelAnalysis = useCallback(() => {
    audioAnalysisService.cancelAnalysis();
  }, []);
  
  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setAudioBuffer(null);
    setAnalysis(null);
    setIsLoading(false);
    setProgress(0);
    setError(null);
    sourceRef.current = null;
  }, []);
  
  /**
   * Auto-analyze when source changes (if enabled)
   */
  useEffect(() => {
    if (initialSource && options.autoAnalyze) {
      (async () => {
        try {
          await loadAudio(initialSource);
          await analyzeAudio();
        } catch (err) {
          // Error already handled in the respective functions
        }
      })();
    }
  }, [initialSource, options.autoAnalyze, loadAudio, analyzeAudio]);
  
  return {
    audioBuffer,
    analysis,
    isLoading,
    progress,
    error,
    loadAudio,
    analyzeAudio,
    extractWaveform,
    detectBeats,
    extractFeatures,
    analyzeSections,
    cancelAnalysis,
    reset
  };
}

export default useAudioAnalysis;
