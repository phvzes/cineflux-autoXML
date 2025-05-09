import { useRef, useState, useEffect } from 'react';
import AudioService from '../services/AudioService';

/**
 * Custom hook for using the AudioService
 * Provides a singleton instance of AudioService and common audio functionality
 */
export const useAudioService = () => {
  // Use a ref to maintain a singleton instance of AudioService
  const serviceRef = useRef<AudioService | null>(null);
  
  // Audio state
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [timeUpdateInterval, setTimeUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize the AudioService if it doesn't exist
  if (!serviceRef.current) {
    serviceRef.current = new AudioService();
  }

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      stopAudio();
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  /**
   * Load an audio file and prepare it for playback
   * @param file The audio file to load
   * @param onProgress Optional callback for loading progress
   */
  const loadAudio = async (
    file: File,
    onProgress?: (progress: number, step: string) => void
  ) => {
    try {
      // Stop any currently playing audio
      stopAudio();
      
      // Load the audio file
      const buffer = await AudioService.loadAudio(file, onProgress);
      setAudioBuffer(buffer);
      setDuration(buffer.duration);
      
      // Extract waveform data
      const waveform = await AudioService.extractWaveform(buffer);
      setWaveformData(new Float32Array(waveform.data));
      
      return { buffer, waveform };
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  };

  /**
   * Analyze an audio file to extract features
   * @param file The audio file to analyze
   * @param onProgress Optional callback for analysis progress
   */
  const analyzeAudio = async (
    file: File,
    onProgress?: (progress: number, step: string) => void
  ) => {
    try {
      const analysis = await AudioService.analyzeAudio(file, onProgress || (() => {}));
      return analysis;
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw error;
    }
  };

  /**
   * Play audio from the specified time
   * @param startTime Time in seconds to start playback from
   */
  const playAudio = (startTime: number = 0) => {
    if (!audioBuffer) return;
    
    // Stop any currently playing audio
    stopAudio();
    
    try {
      // Create a new audio context
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
      
      // Create a new source node
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect to destination
      source.connect(context.destination);
      
      // Start playback
      source.start(0, startTime);
      setAudioSource(source);
      setIsPlaying(true);
      
      // Calculate the time when playback started
      const startedAtTime = context.currentTime - startTime;
      setStartedAt(startedAtTime);
      
      // Update current time during playback
      const interval = setInterval(() => {
        const newTime = context.currentTime - startedAtTime;
        
        if (newTime >= audioBuffer.duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          clearInterval(interval);
          setTimeUpdateInterval(null);
        } else {
          setCurrentTime(newTime);
        }
      }, 100);
      
      setTimeUpdateInterval(interval);
      
      // When playback ends
      source.onended = () => {
        setIsPlaying(false);
        clearInterval(interval);
        setTimeUpdateInterval(null);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  /**
   * Pause audio playback
   */
  const pauseAudio = () => {
    if (audioSource) {
      audioSource.stop();
      setAudioSource(null);
    }
    
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval);
      setTimeUpdateInterval(null);
    }
    
    setIsPlaying(false);
  };

  /**
   * Stop audio playback and reset position
   */
  const stopAudio = () => {
    pauseAudio();
    setCurrentTime(0);
  };

  /**
   * Toggle between play and pause
   */
  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(currentTime);
    }
  };

  /**
   * Seek to a specific time in the audio
   * @param time Time in seconds to seek to
   */
  const seekTo = (time: number) => {
    if (!audioBuffer) return;
    
    // Ensure time is within valid range
    time = Math.max(0, Math.min(time, audioBuffer.duration));
    
    setCurrentTime(time);
    
    // If currently playing, restart from new position
    if (isPlaying) {
      pauseAudio();
      playAudio(time);
    }
  };

  /**
   * Get the current audio context
   * @returns The current AudioContext or creates a new one
   */
  const getAudioContext = () => {
    if (!audioContext || audioContext.state === 'closed') {
      const newContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(newContext);
      return newContext;
    }
    return audioContext;
  };

  return {
    // The AudioService instance
    service: serviceRef.current,
    
    // Audio state
    audioBuffer,
    waveformData,
    isPlaying,
    currentTime,
    duration,
    
    // Methods
    loadAudio,
    analyzeAudio,
    playAudio,
    pauseAudio,
    stopAudio,
    togglePlayPause,
    seekTo,
    getAudioContext,
  };
};

export default useAudioService;
