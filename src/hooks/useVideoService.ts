/**
 * useVideoService.ts
 * 
 * Custom hook for using the VideoService in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import videoService from '../services/VideoService';
import { VideoFile, VideoAnalysis, VideoFrame, Scene, VideoServiceEvents, VideoProcessingProgress } from '../types/video-types';

/**
 * Custom hook for video file processing and analysis
 */
export const useVideoService = () => {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<VideoProcessingProgress | null>(null);
  const [extractedFrames, setExtractedFrames] = useState<VideoFrame[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);

  // Use refs to avoid stale closures in event listeners
  const videoFileRef = useRef<VideoFile | null>(null);
  const isAnalyzingRef = useRef<boolean>(false);

  /**
   * Initialize event listeners when the hook is first used
   */
  useEffect(() => {
    // Set up event listeners
    const handleAnalysisStart = () => {
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;
      setError(null);
      setProgress({
        stage: 'Initializing',
        progress: 0,
        message: 'Starting video analysis...'
      });
    };

    const handleAnalysisComplete = ({ analysis }: { analysis: VideoAnalysis }) => {
      setVideoAnalysis(analysis);
      setScenes(analysis.scenes);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setProgress({
        stage: 'Complete',
        progress: 1,
        message: 'Analysis complete'
      });
    };

    const handleProgress = ({ message, progress, stage }: {
      message: string;
      progress: number;
      stage?: string;
    }) => {
      setProgress({
        stage: stage || 'Processing',
        progress,
        message
      });
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setProgress(null);
    };

    const handleFrameExtracted = ({ frames }: { frames: VideoFrame[] }) => {
      setExtractedFrames(frames);
    };

    const handleSceneDetected = ({ scenes }: { scenes: Scene[] }) => {
      setScenes(scenes);
    };

    // Register event listeners
    videoService.addEventListener(VideoServiceEvents.ANALYSIS_START, handleAnalysisStart);
    videoService.addEventListener(VideoServiceEvents.ANALYSIS_COMPLETE, handleAnalysisComplete);
    videoService.addEventListener(VideoServiceEvents.PROGRESS, handleProgress);
    videoService.addEventListener(VideoServiceEvents.ERROR, handleError);
    videoService.addEventListener(VideoServiceEvents.FRAME_EXTRACTED, handleFrameExtracted);
    videoService.addEventListener(VideoServiceEvents.SCENE_DETECTED, handleSceneDetected);

    // Clean up event listeners on unmount
    return () => {
      videoService.removeEventListener(VideoServiceEvents.ANALYSIS_START, handleAnalysisStart);
      videoService.removeEventListener(VideoServiceEvents.ANALYSIS_COMPLETE, handleAnalysisComplete);
      videoService.removeEventListener(VideoServiceEvents.PROGRESS, handleProgress);
      videoService.removeEventListener(VideoServiceEvents.ERROR, handleError);
      videoService.removeEventListener(VideoServiceEvents.FRAME_EXTRACTED, handleFrameExtracted);
      videoService.removeEventListener(VideoServiceEvents.SCENE_DETECTED, handleSceneDetected);
    };
  }, []);

  /**
   * Load a video file and extract metadata
   */
  const loadVideoFile = useCallback(async (file: File): Promise<VideoFile> => {
    try {
      setError(null);
      
      // Reset state if a different file is loaded
      if (videoFileRef.current?.name !== file.name) {
        setVideoAnalysis(null);
        setExtractedFrames([]);
        setScenes([]);
      }
      
      const loadedFile = await videoService.loadVideoFile(file);
      setVideoFile(loadedFile);
      videoFileRef.current = loadedFile;
      return loadedFile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video file';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Analyze a video file to extract scenes, content, and motion data
   */
  const analyzeVideo = useCallback(async (file: File): Promise<VideoAnalysis> => {
    try {
      // If already analyzing, don't start a new analysis
      if (isAnalyzingRef.current) {
        throw new Error('Video analysis already in progress');
      }
      
      setError(null);
      
      // Load the file first if not already loaded
      if (!videoFileRef.current || videoFileRef.current.name !== file.name) {
        await loadVideoFile(file);
      }
      
      const analysis = await videoService.analyzeVideo(file);
      setVideoAnalysis(analysis);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze video';
      setError(errorMessage);
      throw err;
    }
  }, [loadVideoFile]);

  /**
   * Extract frames from a video file
   */
  const extractFrames = useCallback(async (
    file: File,
    options: any = { fps: 1, maxFrames: 300 }
  ): Promise<VideoFrame[]> => {
    try {
      setError(null);
      setProgress({
        stage: 'Extracting Frames',
        progress: 0,
        message: 'Starting frame extraction...'
      });
      
      const frames = await videoService.extractFrames(file, options);
      setExtractedFrames(frames);
      
      setProgress({
        stage: 'Extracting Frames',
        progress: 1,
        message: 'Frame extraction complete'
      });
      
      return frames;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract frames';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Detect scenes in a video
   */
  const detectScenes = useCallback(async (
    frames: VideoFrame[],
    options: any = { threshold: 30 }
  ): Promise<Scene[]> => {
    try {
      setError(null);
      setProgress({
        stage: 'Detecting Scenes',
        progress: 0,
        message: 'Starting scene detection...'
      });
      
      const detectedScenes = await videoService.detectScenes(frames, options);
      setScenes(detectedScenes);
      
      setProgress({
        stage: 'Detecting Scenes',
        progress: 1,
        message: 'Scene detection complete'
      });
      
      return detectedScenes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect scenes';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Generate a thumbnail from a video file
   */
  const generateThumbnail = useCallback(async (
    file: File,
    time?: number
  ): Promise<string> => {
    try {
      return await videoService.generateThumbnail(file, time);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate thumbnail';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Get a frame thumbnail at a specific time
   */
  const getFrameAtTime = useCallback((
    time: number
  ): VideoFrame | null => {
    if (!extractedFrames.length) return null;
    
    // Find the frame closest to the requested time
    const closestFrame = extractedFrames.reduce((prev: any, curr: any) => {
      return Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev;
    });
    
    return closestFrame;
  }, [extractedFrames]);

  /**
   * Get a scene that contains the specified time
   */
  const getSceneAtTime = useCallback((
    time: number
  ): Scene | null => {
    if (!scenes.length) return null;
    
    // Find the scene that contains the time
    return scenes.find((scene: any) => time >= scene.startTime && time <= scene.endTime) || null;
  }, [scenes]);

  /**
   * Clear video analysis data
   */
  const clearAnalysis = useCallback(() => {
    setVideoAnalysis(null);
    setExtractedFrames([]);
    setScenes([]);
  }, []);

  return {
    videoFile,
    videoAnalysis,
    isAnalyzing,
    error,
    progress,
    extractedFrames,
    scenes,
    loadVideoFile,
    analyzeVideo,
    extractFrames,
    detectScenes,
    generateThumbnail,
    getFrameAtTime,
    getSceneAtTime,
    clearAnalysis
  };
};

export default useVideoService;