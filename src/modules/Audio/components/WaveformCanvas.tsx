/**
 * WaveformCanvas Component
 * 
 * A React component for rendering audio waveforms using Canvas.
 * Supports customizable appearance, zoom, and playback position.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Waveform } from '../../../types/AudioAnalysis';

interface WaveformCanvasProps {
  /** Waveform data to display */
  waveform: Waveform | null;
  /** Current playback position in seconds */
  currentTime?: number;
  /** Total duration in seconds */
  duration?: number;
  /** Width of the canvas */
  width?: number;
  /** Height of the canvas */
  height?: number;
  /** Zoom level (1 = full view) */
  zoom?: number;
  /** Horizontal scroll position (0-1) */
  scrollPosition?: number;
  /** Color of the waveform */
  waveformColor?: string;
  /** Color of the played portion */
  progressColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Grid line color */
  gridColor?: string;
  /** Show time markers */
  showTimeMarkers?: boolean;
  /** Show beat markers */
  showBeats?: boolean;
  /** Beat markers data */
  beats?: Array<{ time: number; confidence?: number }>;
  /** Beat marker color */
  beatColor?: string;
  /** Callback when clicking on the waveform */
  onPositionClick?: (time: number) => void;
  /** Callback when dragging on the waveform */
  onPositionDrag?: (time: number) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * WaveformCanvas component
 */
const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  waveform,
  currentTime = 0,
  duration,
  width = 800,
  height = 150,
  zoom = 1,
  scrollPosition = 0,
  waveformColor = '#2563eb',
  progressColor = '#60a5fa',
  backgroundColor = '#f8fafc',
  gridColor = '#e2e8f0',
  showTimeMarkers = true,
  showBeats = false,
  beats = [],
  beatColor = '#ef4444',
  onPositionClick,
  onPositionDrag,
  className = '',
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [effectiveDuration, setEffectiveDuration] = useState(duration || 0);
  
  // Update effective duration when waveform or duration prop changes
  useEffect(() => {
    if (duration) {
      setEffectiveDuration(duration);
    } else if (waveform) {
      setEffectiveDuration(waveform.duration);
    }
  }, [waveform, duration]);
  
  /**
   * Draw the waveform on the canvas
   */
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform || !waveform.data || waveform.data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate visible portion based on zoom and scroll
    const visibleWidth = canvas.width;
    const totalWidth = visibleWidth * zoom;
    const startOffset = scrollPosition * (totalWidth - visibleWidth);
    
    // Calculate sample step based on zoom
    const samplesPerPixel = waveform.data.length / totalWidth;
    
    // Draw grid lines
    if (showTimeMarkers) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      
      // Determine appropriate time interval based on duration and zoom
      let interval = 1; // seconds
      const visibleDuration = effectiveDuration / zoom;
      
      if (visibleDuration > 120) interval = 30;
      else if (visibleDuration > 60) interval = 10;
      else if (visibleDuration > 30) interval = 5;
      else if (visibleDuration > 10) interval = 2;
      
      // Draw vertical time markers
      for (let time = 0; time <= effectiveDuration; time += interval) {
        const x = (time / effectiveDuration) * totalWidth - startOffset;
        if (x >= 0 && x <= visibleWidth) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
          
          // Draw time label
          ctx.fillStyle = gridColor;
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          const minutes = Math.floor(time / 60);
          const seconds = Math.floor(time % 60);
          const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          ctx.fillText(timeLabel, x, canvas.height - 5);
        }
      }
      
      // Draw horizontal amplitude grid lines
      const amplitudeLines = 5;
      for (let i = 0; i <= amplitudeLines; i++) {
        const y = (i / amplitudeLines) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
    
    // Calculate playback position in pixels
    const playbackX = (currentTime / effectiveDuration) * totalWidth - startOffset;
    
    // Draw waveform
    const centerY = canvas.height / 2;
    const scaleY = canvas.height / 2; // Scale to fit in half the canvas height
    
    // Draw the waveform in two passes - first the non-played part, then the played part
    for (let pass = 0; pass < 2; pass++) {
      // Set color based on pass (0 = non-played, 1 = played)
      ctx.fillStyle = pass === 0 ? waveformColor : progressColor;
      
      // For each pixel in the visible area
      for (let x = 0; x < visibleWidth; x++) {
        // Calculate the actual x position in the total waveform
        const totalX = x + startOffset;
        
        // Skip if this pixel is not in the current pass
        if ((pass === 0 && totalX / totalWidth * effectiveDuration <= currentTime) ||
            (pass === 1 && totalX / totalWidth * effectiveDuration > currentTime)) {
          continue;
        }
        
        // Find the corresponding samples in the waveform data
        const sampleIndex = Math.floor(totalX * samplesPerPixel);
        
        // Calculate the min and max values for this pixel
        let minVal = 0;
        let maxVal = 0;
        
        // Average multiple samples per pixel for smoother rendering
        for (let i = 0; i < samplesPerPixel && sampleIndex + i < waveform.data.length; i++) {
          const sampleValue = waveform.data[sampleIndex + i];
          minVal = Math.min(minVal, sampleValue);
          maxVal = Math.max(maxVal, sampleValue);
        }
        
        // Draw the waveform bar
        const barHeight = Math.max(1, (maxVal - minVal) * scaleY);
        ctx.fillRect(
          x,
          centerY + minVal * scaleY,
          1,
          barHeight
        );
      }
    }
    
    // Draw playback position line
    if (playbackX >= 0 && playbackX <= visibleWidth) {
      ctx.strokeStyle = '#ef4444'; // Red playhead
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playbackX, 0);
      ctx.lineTo(playbackX, canvas.height);
      ctx.stroke();
    }
    
    // Draw beat markers
    if (showBeats && beats && beats.length > 0) {
      ctx.fillStyle = beatColor;
      
      beats.forEach(beat => {
        const beatX = (beat.time / effectiveDuration) * totalWidth - startOffset;
        
        if (beatX >= 0 && beatX <= visibleWidth) {
          // Size based on confidence if available
          const size = beat.confidence ? 3 + beat.confidence * 5 : 5;
          
          ctx.beginPath();
          ctx.arc(beatX, 15, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    
  }, [
    waveform, 
    currentTime, 
    effectiveDuration, 
    zoom, 
    scrollPosition, 
    width, 
    height, 
    waveformColor, 
    progressColor, 
    backgroundColor, 
    gridColor, 
    showTimeMarkers, 
    showBeats, 
    beats, 
    beatColor
  ]);
  
  // Draw waveform when component mounts or when relevant props change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);
  
  /**
   * Handle mouse down event
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !effectiveDuration) return;
    
    setIsDragging(true);
    
    // Calculate time position
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalWidth = width * zoom;
    const startOffset = scrollPosition * (totalWidth - width);
    const clickPosition = (x + startOffset) / totalWidth;
    const time = clickPosition * effectiveDuration;
    
    // Call the click handler
    if (onPositionClick) {
      onPositionClick(time);
    }
    
    // Also call the drag handler to start dragging
    if (onPositionDrag) {
      onPositionDrag(time);
    }
  };
  
  /**
   * Handle mouse move event
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || !effectiveDuration || !onPositionDrag) return;
    
    // Calculate time position
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalWidth = width * zoom;
    const startOffset = scrollPosition * (totalWidth - width);
    const dragPosition = (x + startOffset) / totalWidth;
    const time = Math.max(0, Math.min(effectiveDuration, dragPosition * effectiveDuration));
    
    // Call the drag handler
    onPositionDrag(time);
  };
  
  /**
   * Handle mouse up event
   */
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  /**
   * Handle mouse leave event
   */
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  // Add global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className={`waveform-container ${className}`}
      style={{ width, height, position: 'relative', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
};

export default WaveformCanvas;
