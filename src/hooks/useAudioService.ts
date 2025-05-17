/**
 * useAudioService.ts
 * 
 * A hook for accessing audio processing functionality throughout the application.
 */

import { useCallback, useState } from 'react';
import AudioService from '../services/AudioService';
import { AudioAnalysis } from '../types/AudioAnalysis';

/**
 * Hook for accessing audio processing functionality
 */
export const useAudioService = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  
  // Create a singleton instance of the audio service
  const audioService = new AudioService();
  
  /**
   * Analyze an audio file to detect beats, energy levels, etc.
   */
  const analyzeAudio = useCallback(async (
    audioFile: File,
    options: { 
      beatDetection?: boolean;
      energyAnalysis?: boolean;
      segmentation?: boolean;
    } = {}
  ): Promise<AudioAnalysis> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setStartedAt(Date.now());
    
    try {
      const result = await audioService.analyzeAudio(audioFile, {
        ...options,
        onProgress: (p) => setProgress(p)
      });
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during audio analysis'));
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [audioService]);
  
  /**
   * Extract waveform data from an audio file
   */
  const extractWaveform = useCallback(async (
    audioFile: File,
    options: { 
      resolution?: number;
      normalize?: boolean;
    } = {}
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await audioService.extractWaveform(audioFile, options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to extract waveform'));
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [audioService]);
  
  /**
   * Detect beats in an audio file
   */
  const detectBeats = useCallback(async (
    audioFile: File,
    options: { 
      sensitivity?: number;
      minTempo?: number;
      maxTempo?: number;
    } = {}
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const result = await audioService.detectBeats(audioFile, {
        ...options,
        onProgress: (p) => setProgress(p)
      });
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Beat detection failed'));
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [audioService]);
  
  return {
    isProcessing,
    progress,
    error,
    analyzeAudio,
    extractWaveform,
    detectBeats,
    audioService
  };
};

export default useAudioService;
