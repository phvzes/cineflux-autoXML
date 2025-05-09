
import { useState, useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseAudioWaveformProps {
  /** Container element for the waveform */
  container: HTMLElement | null;
  /** URL of the audio file */
  audioUrl: string;
  /** Current playback time in seconds */
  currentTime: number;
  /** Callback when seeking to a specific time */
  onSeek: (time: number) => void;
  /** Optional waveform height */
  height?: number;
  /** Optional waveform color */
  waveColor?: string;
  /** Optional progress color */
  progressColor?: string;
}

/**
 * Hook for audio waveform visualization and interaction
 */
const useAudioWaveform = ({
  container,
  audioUrl,
  currentTime,
  onSeek,
  height = 80,
  waveColor = '#c2c8d1',
  progressColor = '#4353ff',
}: UseAudioWaveformProps) => {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize WaveSurfer
  useEffect(() => {
    if (!container) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create WaveSurfer instance
      const ws = WaveSurfer.create({
        container,
        height,
        waveColor,
        progressColor,
        cursorColor: '#ffffff',
        cursorWidth: 2,
        autoScroll: true,
        autoCenter: true,
        responsive: true,
        normalize: true,
      });
      
      // Set up event listeners
      ws.on('ready', () => {
        setIsReady(true);
        setDuration(ws.getDuration());
        setPeaks(ws.getDecodedData()?.getChannelData(0) || []);
        setIsLoading(false);
      });
      
      ws.on('error', (err) => {
        console.error('WaveSurfer error:', err);
        setError('Failed to load audio waveform');
        setIsLoading(false);
      });
      
      ws.on('seeking', (time: number) => {
        onSeek(time);
      });
      
      // Load audio
      ws.load(audioUrl);
      
      setWavesurfer(ws);
      
      // Cleanup on unmount
      return () => {
        ws.destroy();
      };
    } catch (err) {
      console.error('Error initializing WaveSurfer:', err);
      setError('Failed to initialize audio waveform');
      setIsLoading(false);
    }
  }, [container, audioUrl, height, waveColor, progressColor, onSeek]);
  
  // Update waveform position when currentTime changes
  useEffect(() => {
    if (wavesurfer && isReady && Math.abs(wavesurfer.getCurrentTime() - currentTime) > 0.1) {
      wavesurfer.setTime(currentTime);
    }
  }, [wavesurfer, isReady, currentTime]);
  
  // Seek to a specific time
  const seekTo = useCallback(
    (time: number) => {
      if (wavesurfer && isReady) {
        wavesurfer.setTime(time);
      }
    },
    [wavesurfer, isReady]
  );
  
  // Play audio
  const play = useCallback(() => {
    if (wavesurfer && isReady) {
      wavesurfer.play();
    }
  }, [wavesurfer, isReady]);
  
  // Pause audio
  const pause = useCallback(() => {
    if (wavesurfer && isReady) {
      wavesurfer.pause();
    }
  }, [wavesurfer, isReady]);
  
  // Get amplitude at a specific time
  const getAmplitudeAtTime = useCallback(
    (time: number): number => {
      if (!isReady || !peaks.length || !duration) return 0;
      
      const index = Math.floor((time / duration) * peaks.length);
      return peaks[Math.min(index, peaks.length - 1)] || 0;
    },
    [isReady, peaks, duration]
  );
  
  // Get peak amplitude in a time range
  const getPeakInRange = useCallback(
    (startTime: number, endTime: number): number => {
      if (!isReady || !peaks.length || !duration) return 0;
      
      const startIndex = Math.floor((startTime / duration) * peaks.length);
      const endIndex = Math.floor((endTime / duration) * peaks.length);
      
      let peak = 0;
      for (let i = startIndex; i <= endIndex && i < peaks.length; i++) {
        peak = Math.max(peak, Math.abs(peaks[i] || 0));
      }
      
      return peak;
    },
    [isReady, peaks, duration]
  );
  
  return {
    wavesurfer,
    isReady,
    isLoading,
    error,
    duration,
    peaks,
    seekTo,
    play,
    pause,
    getAmplitudeAtTime,
    getPeakInRange,
  };
};

export default useAudioWaveform;
