
/**
 * useAudioService.ts
 * 
 * Hook for accessing the AudioService functionality
 */

import { useCallback, useMemo } from 'react';
import { audioService, AudioService } from '../services/AudioService';
import { 
  AudioAnalysis, 
  AudioProcessingOptions, 
  BeatAnalysis, 
  BeatDetectionOptions, 
  EnergyAnalysis, 
  EnergyAnalysisOptions, 
  WaveformData, 
  WaveformGenerationOptions 
} from '../types/audio-types';

/**
 * Hook to access AudioService functionality
 */
export const useAudioService = () => {
  // Create a memoized instance of the AudioService
  const service = useMemo(() => {
    return audioService;
  }, []);

  // Wrap methods in useCallback to prevent unnecessary re-renders
  const analyzeAudio = useCallback(
    (file: File, options?: AudioProcessingOptions) => service.analyzeAudio(file, options),
    [service]
  );

  const detectBeats = useCallback(
    (file: File, options?: BeatDetectionOptions) => service.detectBeats(file, options),
    [service]
  );

  const analyzeEnergy = useCallback(
    (file: File, options?: EnergyAnalysisOptions) => service.analyzeEnergy(file, options),
    [service]
  );

  const generateWaveform = useCallback(
    (file: File, options?: WaveformGenerationOptions) => service.generateWaveform(file, options),
    [service]
  );

  return {
    analyzeAudio,
    detectBeats,
    analyzeEnergy,
    generateWaveform,
    service
  };
};

export default useAudioService;
