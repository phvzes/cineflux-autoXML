/**
 * useVideoService.ts
 * 
 * Hook for accessing the VideoService functionality
 */

import { useCallback, useMemo } from 'react';
import { videoService, VideoService, ThumbnailOptions, VideoFile } from '../services/VideoService';

/**
 * Hook to access VideoService functionality
 */
export const useVideoService = () => {
  // Create a memoized instance of the VideoService
  const service = useMemo(() => {
    return videoService;
  }, []);

  // Wrap methods in useCallback to prevent unnecessary re-renders
  const analyzeVideo = useCallback(
    (file: File, options?: any) => service.analyzeVideo(file, options),
    [service]
  );

  const extractFrames = useCallback(
    (file: File, options?: any) => service.extractFrames(file, options),
    [service]
  );

  const generateThumbnail = useCallback(
    (file: File, time: number, options?: ThumbnailOptions) => 
      service.generateThumbnail(file, time, options),
    [service]
  );

  const loadVideoFile = useCallback(
    (file: File) => service.loadVideoFile(file),
    [service]
  );

  return {
    analyzeVideo,
    extractFrames,
    generateThumbnail,
    loadVideoFile,
    videoService: service
  };
};

export default useVideoService;
