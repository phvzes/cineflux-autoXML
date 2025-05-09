
import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { TimelineCutPoint } from '../../types/EditDecision';

// Import CSS
import '../../styles/waveform.css';

interface WaveformProps {
  /** Source URL for the audio */
  src: string;
  /** Width of the waveform */
  width?: number;
  /** Height of the waveform */
  height?: number;
  /** Whether to show the timeline */
  showTimeline?: boolean;
  /** Whether to show the cursor */
  showCursor?: boolean;
  /** Array of markers to display on the waveform */
  markers?: TimelineCutPoint[];
  /** Current time in seconds */
  currentTime?: number;
  /** Callback when the current time changes */
  onTimeUpdate?: (time: number) => void;
  /** Callback when the waveform is ready */
  onReady?: (wavesurfer: WaveSurfer) => void;
  /** Callback when a marker is clicked */
  onMarkerClick?: (marker: TimelineCutPoint) => void;
  /** Waveform color */
  waveColor?: string;
  /** Progress color */
  progressColor?: string;
  /** Cursor color */
  cursorColor?: string;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Waveform display component using wavesurfer.js
 */
const Waveform: React.FC<WaveformProps> = ({
  src,
  width = '100%',
  height = 128,
  showTimeline = true,
  showCursor = true,
  markers = [],
  currentTime = 0,
  onTimeUpdate,
  onReady,
  onMarkerClick,
  waveColor = '#ddd',
  progressColor = '#3498db',
  cursorColor = '#333',
  backgroundColor = 'transparent'
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  
  // Initialize wavesurfer
  useEffect(() => {
    if (!waveformRef.current) return;
    
    // Create wavesurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor,
      progressColor,
      cursorColor,
      backgroundColor,
      height,
      responsive: true,
      normalize: true,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 2,
      hideScrollbar: true
    });
    
    // Add timeline if enabled
    if (showTimeline && timelineRef.current) {
      const timeline = wavesurfer.registerPlugin({
        name: 'timeline',
        plugin: WaveSurfer.TimelinePlugin,
        params: {
          container: timelineRef.current,
          primaryLabelInterval: 10,
          secondaryLabelInterval: 5,
          primaryColor: '#000',
          secondaryColor: '#666',
          primaryFontColor: '#000',
          secondaryFontColor: '#666'
        }
      });
    }
    
    // Set up event listeners
    wavesurfer.on('ready', () => {
      setIsReady(true);
      setDuration(wavesurfer.getDuration());
      
      if (onReady) {
        onReady(wavesurfer);
      }
    });
    
    wavesurfer.on('seeking', (time: number) => {
      setSeeking(true);
      
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    });
    
    wavesurfer.on('timeupdate', (time: number) => {
      if (!seeking && onTimeUpdate) {
        onTimeUpdate(time);
      }
    });
    
    // Load audio
    wavesurfer.load(src);
    
    // Store reference
    wavesurferRef.current = wavesurfer;
    
    // Clean up on unmount
    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);
  
  // Update source when it changes
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !isReady) return;
    
    wavesurfer.load(src);
  }, [src, isReady]);
  
  // Update current time when it changes externally
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !isReady || seeking) return;
    
    // Only update if the difference is significant
    const currentWavesurferTime = wavesurfer.getCurrentTime();
    if (Math.abs(currentWavesurferTime - currentTime) > 0.1) {
      wavesurfer.setTime(currentTime);
    }
  }, [currentTime, isReady, seeking]);
  
  // Add markers to the waveform
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !isReady || markers.length === 0) return;
    
    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.wavesurfer-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    // Add new markers
    markers.forEach(marker => {
      const position = typeof marker.position === 'number' ? marker.position : 0;
      const percent = (position / duration) * 100;
      
      if (percent < 0 || percent > 100) return;
      
      const markerElement = document.createElement('div');
      markerElement.className = 'wavesurfer-marker';
      markerElement.style.left = `${percent}%`;
      markerElement.setAttribute('data-id', marker.id);
      markerElement.setAttribute('data-time', position.toString());
      markerElement.setAttribute('data-label', marker.label || '');
      markerElement.setAttribute('data-type', marker.type);
      
      // Set color based on marker type
      switch (marker.type) {
        case 'in':
          markerElement.style.backgroundColor = '#00ff00';
          break;
        case 'out':
          markerElement.style.backgroundColor = '#ff0000';
          break;
        case 'marker':
          markerElement.style.backgroundColor = '#ffff00';
          break;
        case 'chapter':
          markerElement.style.backgroundColor = '#0000ff';
          break;
        default:
          markerElement.style.backgroundColor = '#ffffff';
      }
      
      // Add tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'wavesurfer-marker-tooltip';
      tooltip.textContent = marker.label || `Marker at ${position.toFixed(2)}s`;
      markerElement.appendChild(tooltip);
      
      // Add click handler
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (onMarkerClick) {
          onMarkerClick(marker);
        } else {
          wavesurfer.setTime(position);
        }
      });
      
      waveformRef.current?.appendChild(markerElement);
    });
  }, [markers, isReady, duration, onMarkerClick]);
  
  // Handle seeking end
  const handleMouseUp = useCallback(() => {
    if (seeking) {
      setSeeking(false);
    }
  }, [seeking]);
  
  // Add mouse up event listener to handle seeking end
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);
  
  return (
    <div className="waveform-container" style={{ width }}>
      <div ref={waveformRef} className="waveform" />
      {showTimeline && <div ref={timelineRef} className="waveform-timeline" />}
    </div>
  );
};

export default Waveform;
