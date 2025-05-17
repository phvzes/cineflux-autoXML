/**
 * useVideoService.ts
 * 
 * A hook for accessing video processing functionality throughout the application.
 */

import { useCallback, useState } from 'react';
import VideoService from '../services/VideoService';

// Define types for thumbnail options
export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  timestamp?: number;
}

/**
 * Hook for accessing video processing functionality
 */
export const useVideoService = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  // Create a singleton instance of the video service
  const videoService = new VideoService();
  
  /**
   * Extract frames from a video file
   */
  const extractFrames = useCallback(async (
    videoFile: File,
    options: { fps?: number; maxFrames?: number } = {}
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const result = await videoService.extractFrames(videoFile, {
        ...options,
        onProgress: (p) => setProgress(p)
      });
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during frame extraction'));
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [videoService]);
  
  /**
   * Generate a thumbnail from a video file
   */
  const generateThumbnail = useCallback(async (
    videoFile: File,
    options: ThumbnailOptions = {}
  ) => {
    try {
      return await videoService.generateThumbnail(videoFile, options);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate thumbnail'));
      throw err;
    }
  }, [videoService]);
  
  /**
   * Detect scenes in a video file
   */
  const detectScenes = useCallback(async (
    videoFile: File,
    options: { threshold?: number } = {}
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const result = await videoService.detectScenes(videoFile, {
        ...options,
        onProgress: (p) => setProgress(p)
      });
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Scene detection failed'));
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [videoService]);
  
  return {
    isProcessing,
    progress,
    error,
    extractFrames,
    generateThumbnail,
    detectScenes,
    videoService
  };
};

export default useVideoService;
