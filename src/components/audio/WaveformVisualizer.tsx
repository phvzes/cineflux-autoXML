import React, { useEffect, useRef, useState } from 'react';
import { Beat } from '../../types/AudioAnalysis';

interface WaveformVisualizerProps {
  /**
   * The audio buffer to visualize
   */
  audioBuffer?: AudioBuffer;
  
  /**
   * Pre-computed waveform data (alternative to audioBuffer)
   */
  waveformData?: number[];
  
  /**
   * Array of detected beats
   */
  beats?: Beat[];
  
  /**
   * Current playback position in seconds
   */
  currentTime?: number;
  
  /**
   * Width of the visualization in pixels
   */
  width?: number;
  
  /**
   * Height of the visualization in pixels
   */
  height?: number;
  
  /**
   * Color of the waveform
   */
  waveformColor?: string;
  
  /**
   * Color of the beat markers
   */
  beatColor?: string;
  
  /**
   * Color of the playback position marker
   */
  positionColor?: string;
  
  /**
   * Whether to show beat markers
   */
  showBeats?: boolean;
  
  /**
   * Whether to show the playback position
   */
  showPosition?: boolean;
  
  /**
   * Callback when a position on the waveform is clicked
   */
  onPositionClick?: (time: number) => void;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Component for visualizing audio waveforms and beat markers
 */
const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioBuffer,
  waveformData,
  beats = [],
  currentTime = 0,
  width = 800,
  height = 200,
  waveformColor = '#2196f3',
  beatColor = '#ff5722',
  positionColor = '#4caf50',
  showBeats = true,
  showPosition = true,
  onPositionClick,
  className = '',
}: any) => {
  // Reference to the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for computed waveform data
  const [computedWaveform, setComputedWaveform] = useState<number[] | null>(null);
  
  // Extract waveform data from audio buffer if provided
  useEffect(() => {
    if (audioBuffer && !waveformData && !computedWaveform) {
      extractWaveform(audioBuffer).then(setComputedWaveform);
    }
  }, [audioBuffer, waveformData, computedWaveform]);
  
  // Draw the waveform when data is available or when props change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Use provided waveform data or computed data
    const data = waveformData || computedWaveform;
    if (!data) return;
    
    // Draw the waveform
    drawWaveform(ctx, data, width, height, waveformColor);
    
    // Draw beat markers if enabled
    if (showBeats && beats.length > 0) {
      drawBeats(ctx, beats, width, height, beatColor);
    }
    
    // Draw playback position if enabled
    if (showPosition && audioBuffer) {
      drawPosition(ctx, currentTime, audioBuffer.duration, width, height, positionColor);
    }
  }, [
    waveformData, 
    computedWaveform, 
    beats, 
    currentTime, 
    width, 
    height, 
    waveformColor, 
    beatColor, 
    positionColor, 
    showBeats, 
    showPosition, 
    audioBuffer
  ]);
  
  // Handle click on the waveform
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPositionClick || !audioBuffer) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Calculate the clicked position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Convert to time
    const time = (x / width) * audioBuffer.duration;
    
    // Call the callback
    onPositionClick(time);
  };
  
  return (
    <div className={`waveform-visualizer ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

/**
 * Extract waveform data from an audio buffer
 */
async function extractWaveform(audioBuffer: AudioBuffer): Promise<number[]> {
  // Get the number of channels
  const channels = audioBuffer.numberOfChannels;
  
  // Determine how many samples to include in the waveform
  // We'll aim for about 2 samples per pixel for a detailed waveform
  const targetSamples = 2000;
  
  // Calculate the step size to achieve the target number of samples
  const stepSize = Math.floor(audioBuffer.length / targetSamples);
  
  // Initialize the waveform data array
  const data: number[] = new Array(targetSamples).fill(0);
  
  // Process each channel
  for (let channel = 0; channel < channels; channel++) {
    // Get the channel data
    const channelData = audioBuffer.getChannelData(channel);
    
    // Extract samples at regular intervals
    for (let i = 0; i < targetSamples; i++) {
      // Calculate the start index for this sample
      const startIndex = i * stepSize;
      
      // Calculate the maximum amplitude for this window
      let max = 0;
      
      for (let j = 0; j < stepSize && startIndex + j < channelData.length; j++) {
        const amplitude = Math.abs(channelData[startIndex + j]);
        max = Math.max(max, amplitude);
      }
      
      // Use the maximum amplitude for this window
      // For multi-channel audio, we'll take the average across channels
      data[i] += max / channels;
    }
  }
  
  return data;
}

/**
 * Draw a waveform on a canvas
 */
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: number[],
  width: number,
  height: number,
  color: string
) {
  // Set the stroke style
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  // Find the maximum amplitude
  const maxAmplitude = Math.max(...data, 0.01); // Avoid division by zero
  
  // Calculate the scale factor
  const scaleY = height / 2;
  
  // Calculate the step size
  const stepX = width / data.length;
  
  // Begin the path
  ctx.beginPath();
  
  // Move to the first point
  ctx.moveTo(0, height / 2);
  
  // Draw the waveform
  for (let i = 0; i < data.length; i++) {
    const x = i * stepX;
    const y = height / 2 - (data[i] / maxAmplitude) * scaleY;
    
    ctx.lineTo(x, y);
  }
  
  // Stroke the path
  ctx.stroke();
  
  // Draw the mirror image (bottom half)
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  
  for (let i = 0; i < data.length; i++) {
    const x = i * stepX;
    const y = height / 2 + (data[i] / maxAmplitude) * scaleY;
    
    ctx.lineTo(x, y);
  }
  
  ctx.stroke();
}

/**
 * Draw beat markers on a canvas
 */
function drawBeats(
  ctx: CanvasRenderingContext2D,
  beats: Beat[],
  width: number,
  height: number,
  color: string
) {
  // Set the fill style
  ctx.fillStyle = color;
  
  // Find the maximum time
  const maxTime = Math.max(...beats.map((beat: any) => beat.time), 0.01); // Avoid division by zero
  
  // Draw each beat
  for (const beat of beats) {
    // Calculate the x position
    const x = (beat.time / maxTime) * width;
    
    // Draw a vertical line
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.globalAlpha = beat.confidence || 0.7; // Use beat confidence for opacity
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    
    // Draw a circle at the top
    ctx.beginPath();
    ctx.arc(x, 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw the playback position on a canvas
 */
function drawPosition(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  duration: number,
  width: number,
  height: number,
  color: string
) {
  // Set the stroke style
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  
  // Calculate the x position
  const x = (currentTime / duration) * width;
  
  // Draw a vertical line
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
  
  // Draw a circle at the top
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, 10, 8, 0, Math.PI * 2);
  ctx.fill();
}

export default WaveformVisualizer;
