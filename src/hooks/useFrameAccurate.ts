
import { useRef, useCallback, useState, useEffect } from 'react';

interface FrameAccurateOptions {
  /**
   * Frames per second for the video
   */
  fps: number;
  
  /**
   * Total duration of the video in seconds
   */
  duration: number;
  
  /**
   * Callback when the current frame changes
   */
  onFrameChange?: (frame: number, time: number) => void;
}

/**
 * Hook for frame-accurate video control
 */
export function useFrameAccurate({
  fps,
  duration,
  onFrameChange
}: FrameAccurateOptions) {
  // Current time in seconds
  const [currentTime, setCurrentTime] = useState(0);
  
  // Current frame number
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // Total number of frames
  const totalFrames = Math.floor(duration * fps);
  
  // Reference to the video element
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Reference to the player instance
  const playerRef = useRef<any>(null);
  
  // Set the player reference
  const setPlayerRef = useCallback((player: any) => {
    playerRef.current = player;
  }, []);
  
  // Set the video reference
  const setVideoRef = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);
  
  // Convert time to frame number
  const timeToFrame = useCallback((time: number): number => {
    return Math.floor(time * fps);
  }, [fps]);
  
  // Convert frame number to time
  const frameToTime = useCallback((frame: number): number => {
    return frame / fps;
  }, [fps]);
  
  // Seek to a specific frame
  const seekToFrame = useCallback((frame: number) => {
    if (frame < 0) frame = 0;
    if (frame > totalFrames) frame = totalFrames;
    
    const time = frameToTime(frame);
    
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    
    setCurrentFrame(frame);
    setCurrentTime(time);
    
    if (onFrameChange) {
      onFrameChange(frame, time);
    }
  }, [frameToTime, totalFrames, onFrameChange]);
  
  // Step forward one frame
  const stepForward = useCallback(() => {
    seekToFrame(currentFrame + 1);
  }, [currentFrame, seekToFrame]);
  
  // Step backward one frame
  const stepBackward = useCallback(() => {
    seekToFrame(currentFrame - 1);
  }, [currentFrame, seekToFrame]);
  
  // Handle time update from the video element
  const handleTimeUpdate = useCallback((time: number) => {
    const frame = timeToFrame(time);
    
    if (frame !== currentFrame) {
      setCurrentFrame(frame);
      
      if (onFrameChange) {
        onFrameChange(frame, time);
      }
    }
    
    setCurrentTime(time);
  }, [currentFrame, timeToFrame, onFrameChange]);
  
  // Format time as timecode (HH:MM:SS:FF)
  const formatTimecode = useCallback((time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * fps);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }, [fps]);
  
  // Format frame as timecode (HH:MM:SS:FF)
  const formatFrameTimecode = useCallback((frame: number): string => {
    return formatTimecode(frameToTime(frame));
  }, [formatTimecode, frameToTime]);
  
  // Update current frame when current time changes
  useEffect(() => {
    const frame = timeToFrame(currentTime);
    
    if (frame !== currentFrame) {
      setCurrentFrame(frame);
      
      if (onFrameChange) {
        onFrameChange(frame, currentTime);
      }
    }
  }, [currentTime, currentFrame, timeToFrame, onFrameChange]);
  
  return {
    currentTime,
    currentFrame,
    totalFrames,
    setVideoRef,
    setPlayerRef,
    seekToFrame,
    stepForward,
    stepBackward,
    handleTimeUpdate,
    formatTimecode,
    formatFrameTimecode,
    timeToFrame,
    frameToTime
  };
}

export default useFrameAccurate;
