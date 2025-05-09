
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';

export interface AudioWaveformRef {
  wavesurfer: WaveSurfer | null;
  seekTo: (time: number) => void;
}

interface AudioWaveformProps {
  /** URL of the audio file to visualize */
  audioUrl: string;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Callback when seeking to a specific time */
  onSeek: (time: number) => void;
  /** Optional height of the waveform in pixels */
  height?: number;
  /** Optional waveform color */
  waveColor?: string;
  /** Optional progress color */
  progressColor?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Audio waveform visualization component
 */
const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(
  (
    {
      audioUrl,
      currentTime,
      duration,
      onSeek,
      height = 80,
      waveColor = '#c2c8d1',
      progressColor = '#4353ff',
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
    const [isReady, setIsReady] = useState(false);
    
    // Expose wavesurfer instance via ref
    useImperativeHandle(ref, () => ({
      wavesurfer,
      seekTo: (time: number) => {
        if (wavesurfer && isReady) {
          wavesurfer.setTime(time);
        }
      },
    }));
    
    // Initialize WaveSurfer
    useEffect(() => {
      if (!containerRef.current) return;
      
      // Create WaveSurfer instance
      const ws = WaveSurfer.create({
        container: containerRef.current,
        height,
        waveColor,
        progressColor,
        cursorColor: '#ffffff',
        cursorWidth: 2,
        autoScroll: true,
        autoCenter: true,
        responsive: true,
        normalize: true,
        plugins: [
          TimelinePlugin.create({
            container: containerRef.current,
            primaryLabelInterval: 5,
            secondaryLabelInterval: 1,
            primaryColor: 'rgba(255, 255, 255, 0.5)',
            secondaryColor: 'rgba(255, 255, 255, 0.2)',
            primaryFontColor: '#ffffff',
            secondaryFontColor: '#ffffff',
          }),
        ],
      });
      
      // Load audio
      ws.load(audioUrl);
      
      // Set up event listeners
      ws.on('ready', () => {
        setIsReady(true);
      });
      
      ws.on('seeking', (time: number) => {
        onSeek(time);
      });
      
      setWavesurfer(ws);
      
      // Cleanup on unmount
      return () => {
        ws.destroy();
      };
    }, [audioUrl, height, waveColor, progressColor, onSeek]);
    
    // Update waveform position when currentTime changes
    useEffect(() => {
      if (wavesurfer && isReady && Math.abs(wavesurfer.getCurrentTime() - currentTime) > 0.1) {
        wavesurfer.setTime(currentTime);
      }
    }, [wavesurfer, isReady, currentTime]);
    
    return (
      <div className={`audio-waveform ${className}`}>
        <div ref={containerRef} className="waveform-container" />
      </div>
    );
  }
);

export default AudioWaveform;
