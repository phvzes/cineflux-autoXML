/**
 * useVideoService.ts
 * 
 * Hook for accessing the VideoService functionality
 */

import { useCallback, useMemo } from 'react';
import { VideoService } from '../services/VideoService';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Hook to access VideoService functionality
 */
export const useVideoService = () => {
  // Create a memoized instance of the VideoService
  const videoService = useMemo(() => {
    return VideoService.getInstance();
  }, []);

  // Wrap methods in useCallback to prevent unnecessary re-renders
  const analyzeVideo = useCallback(
    (file: File, options?: any) => videoService.analyzeVideo(file, options),
    [videoService]
  );

  const extractFrames = useCallback(
    (file: File, options?: any) => videoService.extractFrames(file, options),
    [videoService]
  );

  const generateThumbnail = useCallback(
    (file: File, time: number, options?: any) => 
      videoService.generateThumbnail(file, time, options),
    [videoService]
  );

  return {
    analyzeVideo,
    extractFrames,
    generateThumbnail,
    videoService
  };
};

export default useVideoService;
