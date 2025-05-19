/**
 * useAudioService.ts
 * 
 * Hook for accessing the AudioService functionality
 */

import { useCallback, useMemo } from 'react';
import { audioService } from '../services/AudioService';

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
    (file: File, options?: any) => service.analyzeAudio(file, options),
    [service]
  );

  const detectBeats = useCallback(
    (file: File, options?: any) => service.detectBeats(file, options),
    [service]
  );

  const analyzeEnergy = useCallback(
    (file: File, options?: any) => service.analyzeEnergy(file, options),
    [service]
  );

  const generateWaveform = useCallback(
    (file: File, options?: any) => service.generateWaveform(file, options),
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
