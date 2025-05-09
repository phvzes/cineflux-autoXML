
import { useRef, useState, useEffect, useCallback } from 'react';
import { EditDecisionList, MatchedClip, Transition } from '../../../types/EditDecision';
import { PreviewPlayerRef } from '../components/PreviewPlayer';
import { AudioWaveformRef } from '../components/AudioWaveform';

/**
 * Hook for managing preview playback state and controls
 * @param editDecisionList The edit decision list to preview
 */
const usePreview = (editDecisionList: EditDecisionList) => {
  // Player refs
  const playerRef = useRef<PreviewPlayerRef>(null);
  const waveformRef = useRef<AudioWaveformRef>(null);
  
  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Number(editDecisionList.totalDuration) || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // Frame navigation
  const framerate = editDecisionList.framerate;
  const currentFrame = Math.floor(currentTime * framerate);
  const totalFrames = Math.floor(duration * framerate);
  
  // Initialize duration from EDL
  useEffect(() => {
    setDuration(Number(editDecisionList.totalDuration) || 0);
  }, [editDecisionList]);
  
  // Set up playback timer for updating current time
  useEffect(() => {
    let timer: number;
    
    if (isPlaying) {
      timer = window.setInterval(() => {
        if (playerRef.current) {
          const newTime = playerRef.current.getCurrentTime();
          setCurrentTime(newTime);
          
          // Check if we've reached the end
          if (newTime >= duration) {
            pause();
          }
        }
      }, 33); // ~30fps updates
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPlaying, duration]);
  
  // Play function
  const play = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, []);
  
  // Pause function
  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  }, []);
  
  // Seek function
  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    if (playerRef.current) {
      playerRef.current.seekTo(clampedTime);
      setCurrentTime(clampedTime);
    }
    
    if (waveformRef.current) {
      waveformRef.current.seekTo(clampedTime);
    }
  }, [duration]);
  
  // Seek to frame function
  const seekToFrame = useCallback((frame: number) => {
    const time = frame / framerate;
    seek(time);
  }, [framerate, seek]);
  
  // Next frame function
  const nextFrame = useCallback(() => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      pause();
    }
    
    const nextFrameTime = (currentFrame + 1) / framerate;
    seek(nextFrameTime);
  }, [currentFrame, framerate, isPlaying, pause, seek]);
  
  // Previous frame function
  const prevFrame = useCallback(() => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      pause();
    }
    
    const prevFrameTime = (currentFrame - 1) / framerate;
    seek(Math.max(0, prevFrameTime));
  }, [currentFrame, framerate, isPlaying, pause, seek]);
  
  // Get current clip based on current time
  const getCurrentClip = useCallback((): MatchedClip | null => {
    return (
      editDecisionList.clips.find(
        (clip) =>
          currentTime >= Number(clip.timelineInPoint) &&
          currentTime < Number(clip.timelineOutPoint)
      ) || null
    );
  }, [editDecisionList.clips, currentTime]);
  
  // Get current transition based on current time
  const getCurrentTransition = useCallback((): Transition | null => {
    return (
      editDecisionList.transitions.find((transition) => {
        const halfDuration = Number(transition.duration) / 2;
        const startTime = Number(transition.centerPoint) - halfDuration;
        const endTime = Number(transition.centerPoint) + halfDuration;
        return currentTime >= startTime && currentTime <= endTime;
      }) || null
    );
  }, [editDecisionList.transitions, currentTime]);
  
  return {
    // State
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    currentFrame,
    totalFrames,
    
    // Refs
    playerRef,
    waveformRef,
    
    // Controls
    play,
    pause,
    seek,
    seekToFrame,
    setPlaybackRate,
    nextFrame,
    prevFrame,
    
    // Helpers
    getCurrentClip,
    getCurrentTransition,
  };
};

export default usePreview;
