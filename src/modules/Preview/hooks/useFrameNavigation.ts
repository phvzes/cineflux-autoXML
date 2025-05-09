
import { useState, useCallback, useEffect } from 'react';

interface UseFrameNavigationProps {
  /** Current time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Framerate of the video */
  framerate: number;
  /** Callback when seeking to a specific time */
  onSeek: (time: number) => void;
}

/**
 * Hook for frame-level navigation in video preview
 */
const useFrameNavigation = ({
  currentTime,
  duration,
  framerate,
  onSeek,
}: UseFrameNavigationProps) => {
  // Calculate current frame and total frames
  const [currentFrame, setCurrentFrame] = useState(Math.floor(currentTime * framerate));
  const [totalFrames, setTotalFrames] = useState(Math.floor(duration * framerate));
  
  // Update frame counts when time or duration changes
  useEffect(() => {
    setCurrentFrame(Math.floor(currentTime * framerate));
  }, [currentTime, framerate]);
  
  useEffect(() => {
    setTotalFrames(Math.floor(duration * framerate));
  }, [duration, framerate]);
  
  // Seek to a specific frame
  const seekToFrame = useCallback(
    (frame: number) => {
      const clampedFrame = Math.max(0, Math.min(frame, totalFrames));
      const time = clampedFrame / framerate;
      onSeek(time);
      setCurrentFrame(clampedFrame);
    },
    [framerate, onSeek, totalFrames]
  );
  
  // Go to next frame
  const nextFrame = useCallback(() => {
    if (currentFrame < totalFrames - 1) {
      seekToFrame(currentFrame + 1);
    }
  }, [currentFrame, seekToFrame, totalFrames]);
  
  // Go to previous frame
  const prevFrame = useCallback(() => {
    if (currentFrame > 0) {
      seekToFrame(currentFrame - 1);
    }
  }, [currentFrame, seekToFrame]);
  
  // Jump forward by specified number of frames
  const jumpForward = useCallback(
    (frames: number = 10) => {
      seekToFrame(Math.min(currentFrame + frames, totalFrames - 1));
    },
    [currentFrame, seekToFrame, totalFrames]
  );
  
  // Jump backward by specified number of frames
  const jumpBackward = useCallback(
    (frames: number = 10) => {
      seekToFrame(Math.max(currentFrame - frames, 0));
    },
    [currentFrame, seekToFrame]
  );
  
  // Go to first frame
  const goToFirstFrame = useCallback(() => {
    seekToFrame(0);
  }, [seekToFrame]);
  
  // Go to last frame
  const goToLastFrame = useCallback(() => {
    seekToFrame(totalFrames - 1);
  }, [seekToFrame, totalFrames]);
  
  // Convert frame to timecode (HH:MM:SS:FF)
  const frameToTimecode = useCallback(
    (frame: number) => {
      const totalSeconds = frame / framerate;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const frames = frame % framerate;
      
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames
        .toString()
        .padStart(2, '0')}`;
    },
    [framerate]
  );
  
  // Convert timecode (HH:MM:SS:FF) to frame
  const timecodeToFrame = useCallback(
    (timecode: string) => {
      const parts = timecode.split(':');
      if (parts.length !== 4) return 0;
      
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      const frames = parseInt(parts[3], 10);
      
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      return Math.floor(totalSeconds * framerate) + frames;
    },
    [framerate]
  );
  
  return {
    currentFrame,
    totalFrames,
    seekToFrame,
    nextFrame,
    prevFrame,
    jumpForward,
    jumpBackward,
    goToFirstFrame,
    goToLastFrame,
    frameToTimecode,
    timecodeToFrame,
  };
};

export default useFrameNavigation;
