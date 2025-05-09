/**
 * WaveSurferWrapper Component
 * 
 * A React wrapper for WaveSurfer.js library, providing advanced
 * waveform visualization with regions, markers, and playback controls.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
// Import markers plugin dynamically to avoid TypeScript errors
// since the type definitions might not be available
const MarkersPlugin = WaveSurfer.registerPlugin('markers');

import { Beat, Section } from '../../../types/AudioAnalysis';

interface WaveSurferWrapperProps {
  /** Audio source URL or File */
  audioSrc: string | File | null;
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Waveform color */
  waveColor?: string;
  /** Progress color */
  progressColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show timeline */
  showTimeline?: boolean;
  /** Show regions */
  showRegions?: boolean;
  /** Show beat markers */
  showBeats?: boolean;
  /** Detected beats */
  beats?: Beat[];
  /** Audio sections */
  sections?: Section[];
  /** Initial zoom level */
  initialZoom?: number;
  /** Callback when audio is loaded */
  onReady?: () => void;
  /** Callback when playback position changes */
  onPositionChange?: (time: number) => void;
  /** Callback when a region is clicked */
  onRegionClick?: (region: any) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * WaveSurfer wrapper component
 */
const WaveSurferWrapper: React.FC<WaveSurferWrapperProps> = ({
  audioSrc,
  width = '100%',
  height = 150,
  waveColor = '#2563eb',
  progressColor = '#60a5fa',
  backgroundColor = '#f8fafc',
  showTimeline = true,
  showRegions = true,
  showBeats = true,
  beats = [],
  sections = [],
  initialZoom = 1,
  onReady,
  onPositionChange,
  onRegionClick,
  className = '',
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<any>(null);
  const markersPluginRef = useRef<any>(null);
  
  // State
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(initialZoom);
  
  /**
   * Initialize WaveSurfer instance
   */
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create plugins
    const timelinePlugin = showTimeline && timelineRef.current ? 
      TimelinePlugin.create({
        container: timelineRef.current,
        primaryLabelInterval: 5,
        secondaryLabelInterval: 1,
        // Use compatible options for timeline plugin
        primaryColor: '#1e293b' as any,
        secondaryColor: '#64748b' as any,
        primaryFontColor: '#334155' as any,
        secondaryFontColor: '#64748b' as any
      }) : null;
    
    const regionsPlugin = showRegions ? 
      RegionsPlugin.create() : null;
    
    const markersPlugin = showBeats ? 
      MarkersPlugin.create() : null;
    
    // Store plugins in refs
    regionsPluginRef.current = regionsPlugin;
    markersPluginRef.current = markersPlugin;
    
    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      // Use compatible options for WaveSurfer
      backgroundColor: backgroundColor as any,
      height: Number(height),
      minPxPerSec: 50 * initialZoom,
      plugins: [
        ...(timelinePlugin ? [timelinePlugin] : []),
        ...(regionsPlugin ? [regionsPlugin] : []),
        ...(markersPlugin ? [markersPlugin] : [])
      ]
    });
    
    // Store instance in ref
    wavesurferRef.current = wavesurfer;
    
    // Set up event listeners
    wavesurfer.on('ready', () => {
      setIsReady(true);
      setDuration(wavesurfer.getDuration());
      
      // Apply initial zoom
      wavesurfer.zoom(50 * initialZoom);
      
      if (onReady) onReady();
    });
    
    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('timeupdate', (time) => {
      setCurrentTime(time);
      if (onPositionChange) onPositionChange(time);
    });
    
    // Clean up on unmount
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [
    waveColor, 
    progressColor, 
    backgroundColor, 
    height, 
    showTimeline, 
    showRegions, 
    showBeats, 
    initialZoom, 
    onReady, 
    onPositionChange
  ]);
  
  /**
   * Load audio when source changes
   */
  useEffect(() => {
    if (!wavesurferRef.current || !audioSrc) return;
    
    // Reset state
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
    
    // Load audio
    if (typeof audioSrc === 'string') {
      wavesurferRef.current.load(audioSrc);
    } else {
      // Create object URL for File
      const objectUrl = URL.createObjectURL(audioSrc);
      wavesurferRef.current.load(objectUrl);
      
      // Clean up object URL when done
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [audioSrc]);
  
  /**
   * Update regions when sections change
   */
  useEffect(() => {
    if (!wavesurferRef.current || !regionsPluginRef.current || !isReady || !showRegions || !sections.length) return;
    
    // Clear existing regions
    regionsPluginRef.current.clearRegions();
    
    // Add regions for each section
    sections.forEach((section, index) => {
      const regionId = `section-${index}`;
      
      // Determine color based on section label
      let color = 'rgba(37, 99, 235, 0.2)'; // Default blue
      
      if (section.label === 'intro') {
        color = 'rgba(16, 185, 129, 0.2)'; // Green
      } else if (section.label === 'outro') {
        color = 'rgba(239, 68, 68, 0.2)'; // Red
      } else if (section.label === 'chorus') {
        color = 'rgba(245, 158, 11, 0.2)'; // Orange
      } else if (section.label === 'verse') {
        color = 'rgba(139, 92, 246, 0.2)'; // Purple
      } else if (section.label === 'bridge') {
        color = 'rgba(20, 184, 166, 0.2)'; // Teal
      }
      
      // Create region
      const region = regionsPluginRef.current.addRegion({
        id: regionId,
        start: section.start,
        end: section.start + section.duration,
        color,
        drag: false,
        resize: false,
        attributes: {
          label: section.label,
          confidence: section.confidence,
          energy: section.characteristics?.energy
        }
      });
      
      // Add click handler
      region.on('click', () => {
        if (onRegionClick) onRegionClick(region);
      });
    });
  }, [sections, isReady, showRegions, onRegionClick]);
  
  /**
   * Update beat markers when beats change
   */
  useEffect(() => {
    if (!wavesurferRef.current || !markersPluginRef.current || !isReady || !showBeats || !beats.length) return;
    
    // Clear existing markers
    markersPluginRef.current.clearMarkers();
    
    // Add markers for each beat
    beats.forEach((beat, index) => {
      const markerId = `beat-${index}`;
      
      // Determine marker size based on confidence
      const size = beat.confidence ? 5 + beat.confidence * 5 : 8;
      
      // Create marker
      markersPluginRef.current.add({
        id: markerId,
        time: beat.time,
        label: '',
        color: '#ef4444',
        position: 'top',
        markerElement: {
          style: {
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            backgroundColor: '#ef4444'
          }
        }
      });
    });
  }, [beats, isReady, showBeats]);
  
  /**
   * Update zoom level
   */
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    
    wavesurferRef.current.zoom(50 * zoom);
  }, [zoom, isReady]);
  
  /**
   * Play/pause audio
   */
  const togglePlayPause = useCallback(() => {
    if (!wavesurferRef.current) return;
    
    wavesurferRef.current.playPause();
  }, []);
  
  /**
   * Change zoom level
   */
  const changeZoom = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);
  
  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={`wavesurfer-wrapper ${className}`} style={{ width }}>
      {/* Waveform container */}
      <div ref={containerRef} style={{ width: '100%' }} />
      
      {/* Timeline container */}
      {showTimeline && (
        <div ref={timelineRef} style={{ width: '100%', height: '30px' }} />
      )}
      
      {/* Controls */}
      <div className="wavesurfer-controls" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginTop: '10px'
      }}>
        <button 
          onClick={togglePlayPause}
          style={{
            padding: '5px 10px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <div className="time-display" style={{ fontFamily: 'monospace' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className="zoom-controls">
          <button 
            onClick={() => changeZoom(Math.max(0.5, zoom - 0.5))}
            style={{
              padding: '5px 10px',
              backgroundColor: '#e2e8f0',
              border: 'none',
              borderRadius: '4px',
              marginRight: '5px',
              cursor: 'pointer'
            }}
          >
            -
          </button>
          <button 
            onClick={() => changeZoom(zoom + 0.5)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#e2e8f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaveSurferWrapper;
