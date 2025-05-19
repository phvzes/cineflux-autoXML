/**
 * VideoTimeline.tsx
 * 
 * Component for displaying video and audio timeline with synchronized playback
 * This component integrates AudioService and VideoService for a unified timeline
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVideoService } from '../../hooks/useVideoService';
import { useAudioService } from '../../hooks/useAudioService';
import { Scene, VideoFrame, TimelineMarker, MarkerType } from '../../types/video-types';
import { Beat, AudioSegment } from '../../types/audio-types'; // You may need to create or update this file

interface VideoTimelineProps {
  videoFile?: File;
  audioFile?: File;
  width?: string | number;
  height?: string | number;
  onTimeChange?: (time: number) => void;
  onMarkerSelect?: (marker: TimelineMarker) => void;
  markers?: TimelineMarker[];
  currentTime?: number;
  zoomLevel?: number;
  className?: string;
}

const VideoTimeline: React.FC<VideoTimelineProps> = ({
  videoFile,
  audioFile,
  width = '100%',
  height = 200,
  onTimeChange,
  onMarkerSelect,
  markers = [],
  currentTime = 0,
  zoomLevel = 1,
  className = ''
}) => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(zoomLevel);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [visibleTimeRange, setVisibleTimeRange] = useState({ start: 0, end: 0 });
  const [selectedMarker, setSelectedMarker] = useState<TimelineMarker | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [viewStartTime, setViewStartTime] = useState(0);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(currentTime);
  
  // Services
  const {
    videoFile: loadedVideoFile,
    videoAnalysis,
    scenes,
    extractedFrames,
    loadVideoFile,
    getFrameAtTime,
    getSceneAtTime
  } = useVideoService();
  
  const {
    audioFile: loadedAudioFile,
    waveformData,
    beats,
    segments,
    loadAudioFile,
    getBeatAtTime,
    getSegmentAtTime
  } = useAudioService();
  
  // Derived values
  const duration = (videoAnalysis?.duration || loadedVideoFile?.duration || 
                   loadedAudioFile?.duration || 0);
  const pixelsPerSecond = timelineWidth / (duration / zoom);
  const visibleSeconds = duration / zoom;
  
  // Load files when provided
  useEffect(() => {
    if (videoFile) {
      loadVideoFile(videoFile);
    }
  }, [videoFile, loadVideoFile]);
  
  useEffect(() => {
    if (audioFile) {
      loadAudioFile(audioFile);
    }
  }, [audioFile, loadAudioFile]);
  
  // Update timeline dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setTimelineWidth(width);
        
        // Update visible time range
        const visibleDuration = duration / zoom;
        setVisibleTimeRange({
          start: viewStartTime,
          end: Math.min(viewStartTime + visibleDuration, duration)
        });
      }
    };
    
    updateDimensions();
    
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [duration, zoom, viewStartTime]);
  
  // Sync with external currentTime
  useEffect(() => {
    if (currentTime !== lastTimeRef.current) {
      lastTimeRef.current = currentTime;
      
      // Ensure the current time is visible in the timeline
      if (currentTime < visibleTimeRange.start || currentTime > visibleTimeRange.end) {
        setViewStartTime(Math.max(0, currentTime - visibleSeconds / 2));
      }
      
      // Update video and audio elements
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
      if (audioRef.current) {
        audioRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, visibleTimeRange, visibleSeconds]);
  
  // Handle media playback
  useEffect(() => {
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;
    
    const handlePlay = () => {
      setIsPlaying(true);
      if (videoElement && audioElement) {
        // Sync both elements
        if (videoElement.paused) videoElement.play();
        if (audioElement.paused) audioElement.play();
      } else if (videoElement && videoElement.paused) {
        videoElement.play();
      } else if (audioElement && audioElement.paused) {
        audioElement.play();
      }
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      if (videoElement && !videoElement.paused) videoElement.pause();
      if (audioElement && !audioElement.paused) audioElement.pause();
    };
    
    const handleTimeUpdate = (e: Event) => {
      const newTime = (e.target as HTMLMediaElement).currentTime;
      lastTimeRef.current = newTime;
      
      // Keep media elements in sync
      if (videoElement && audioElement && Math.abs(videoElement.currentTime - audioElement.currentTime) > 0.1) {
        if (e.target === videoElement) {
          audioElement.currentTime = videoElement.currentTime;
        } else {
          videoElement.currentTime = audioElement.currentTime;
        }
      }
      
      if (onTimeChange) {
        onTimeChange(newTime);
      }
      
      // Auto-scroll timeline if playing
      if (isPlaying && (newTime < visibleTimeRange.start || newTime > visibleTimeRange.end)) {
        setViewStartTime(Math.max(0, newTime - visibleSeconds / 4));
      }
    };
    
    if (videoElement) {
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
    }
    
    if (audioElement) {
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
    }
    
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      }
      
      if (audioElement) {
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [isPlaying, onTimeChange, visibleTimeRange, visibleSeconds]);
  
  // Draw timeline canvas
  useEffect(() => {
    const drawTimeline = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Get dimensions
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);
      
      // Visible time range constants
      const visibleDuration = visibleTimeRange.end - visibleTimeRange.start;
      const timeToX = (time: number) => ((time - visibleTimeRange.start) / visibleDuration) * width;
      
      // Draw waveform if available
      if (waveformData && waveformData.length > 0) {
        const waveformHeight = height * 0.3;
        const waveformY = height * 0.5;
        
        ctx.beginPath();
        ctx.strokeStyle = '#3a86ff';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < waveformData.length; i++) {
          const time = (i / waveformData.length) * duration;
          if (time >= visibleTimeRange.start && time <= visibleTimeRange.end) {
            const x = timeToX(time);
            const amplitude = waveformData[i] * waveformHeight;
            
            if (i === 0) {
              ctx.moveTo(x, waveformY - amplitude / 2);
            } else {
              ctx.lineTo(x, waveformY - amplitude / 2);
            }
          }
        }
        
        for (let i = waveformData.length - 1; i >= 0; i--) {
          const time = (i / waveformData.length) * duration;
          if (time >= visibleTimeRange.start && time <= visibleTimeRange.end) {
            const x = timeToX(time);
            const amplitude = waveformData[i] * waveformHeight;
            
            ctx.lineTo(x, waveformY + amplitude / 2);
          }
        }
        
        ctx.closePath();
        ctx.fillStyle = 'rgba(58, 134, 255, 0.2)';
        ctx.fill();
        ctx.stroke();
      }
      
      // Draw scenes if available
      if (scenes && scenes.length > 0) {
        const sceneTrackY = height * 0.75;
        const sceneTrackHeight = height * 0.15;
        
        scenes.forEach((scene, index) => {
          if (scene.endTime >= visibleTimeRange.start && scene.startTime <= visibleTimeRange.end) {
            const x1 = Math.max(0, timeToX(scene.startTime));
            const x2 = Math.min(width, timeToX(scene.endTime));
            
            // Scene block
            ctx.fillStyle = index % 2 === 0 ? '#3a3a3a' : '#2a2a2a';
            ctx.fillRect(x1, sceneTrackY, x2 - x1, sceneTrackHeight);
            
            // Scene boundary
            ctx.fillStyle = '#ff7a45';
            ctx.fillRect(x1, sceneTrackY - 5, 2, sceneTrackHeight + 10);
            
            // Scene labels for wider scenes
            if (x2 - x1 > 40) {
              ctx.fillStyle = '#ffffff';
              ctx.font = '10px Arial';
              ctx.fillText(`Scene ${index + 1}`, x1 + 4, sceneTrackY + 12);
            }
          }
        });
      }
      
      // Draw beats if available
      if (beats && beats.length > 0) {
        const beatY = height * 0.4;
        const beatHeight = height * 0.1;
        
        ctx.fillStyle = '#8338ec';
        
        beats.forEach(beat => {
          if (beat.time >= visibleTimeRange.start && beat.time <= visibleTimeRange.end) {
            const x = timeToX(beat.time);
            ctx.fillRect(x - 1, beatY, 2, beatHeight);
          }
        });
      }
      
      // Draw audio segments if available
      if (segments && segments.length > 0) {
        const segmentY = height * 0.1;
        const segmentHeight = height * 0.15;
        
        segments.forEach((segment, index) => {
          if (segment.endTime >= visibleTimeRange.start && segment.startTime <= visibleTimeRange.end) {
            const x1 = Math.max(0, timeToX(segment.startTime));
            const x2 = Math.min(width, timeToX(segment.endTime));
            
            // Different colors for different segment types
            let color;
            switch (segment.type) {
              case 'verse':
                color = '#0096c7';
                break;
              case 'chorus':
                color = '#e76f51';
                break;
              case 'bridge':
                color = '#8d99ae';
                break;
              default:
                color = '#457b9d';
            }
            
            ctx.fillStyle = color;
            ctx.fillRect(x1, segmentY, x2 - x1, segmentHeight);
            
            // Segment labels for wider segments
            if (x2 - x1 > 40) {
              ctx.fillStyle = '#ffffff';
              ctx.font = '10px Arial';
              ctx.fillText(segment.type, x1 + 4, segmentY + 12);
            }
          }
        });
      }
      
      // Draw custom markers
      if (markers && markers.length > 0) {
        ctx.font = '10px Arial';
        
        markers.forEach(marker => {
          if (marker.time >= visibleTimeRange.start && marker.time <= visibleTimeRange.end) {
            const x = timeToX(marker.time);
            let color;
            let y = 0;
            
            switch (marker.type) {
              case MarkerType.SCENE_BOUNDARY:
                color = '#ff7a45';
                y = height * 0.75;
                break;
              case MarkerType.KEYFRAME:
                color = '#f1c0e8';
                y = height * 0.2;
                break;
              case MarkerType.TRANSITION:
                color = '#1982c4';
                y = height * 0.3;
                break;
              case MarkerType.EDIT_POINT:
                color = '#ffbe0b';
                y = height * 0.1;
                break;
              default:
                color = '#6a994e';
                y = height * 0.5;
            }
            
            // Marker line
            ctx.strokeStyle = color;
            ctx.lineWidth = marker === selectedMarker ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            // Marker label
            if (marker.label) {
              const textWidth = ctx.measureText(marker.label).width;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(x - textWidth / 2 - 2, y - 14, textWidth + 4, 14);
              ctx.fillStyle = color;
              ctx.fillText(marker.label, x - textWidth / 2, y - 4);
            }
          }
        });
      }
      
      // Draw time indicators
      const timeIndicatorInterval = getAppropriateTimeInterval(visibleDuration);
      const startTime = Math.floor(visibleTimeRange.start / timeIndicatorInterval) * timeIndicatorInterval;
      
      ctx.fillStyle = '#808080';
      ctx.font = '10px Arial';
      
      for (let time = startTime; time <= visibleTimeRange.end; time += timeIndicatorInterval) {
        if (time >= visibleTimeRange.start) {
          const x = timeToX(time);
          
          // Time tick
          ctx.strokeStyle = '#808080';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 5);
          ctx.stroke();
          
          // Time label
          const minutes = Math.floor(time / 60);
          const seconds = Math.floor(time % 60);
          const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          ctx.fillText(timeText, x - 10, 15);
        }
      }
      
      // Draw playhead
      if (currentTime >= visibleTimeRange.start && currentTime <= visibleTimeRange.end) {
        const x = timeToX(currentTime);
        
        // Playhead line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Playhead handle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Request next frame if playing
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawTimeline);
      }
    };
    
    drawTimeline();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    waveformData, scenes, beats, segments, markers, selectedMarker,
    duration, currentTime, isPlaying, visibleTimeRange, timelineWidth
  ]);
  
  // Get appropriate time interval for timeline markers
  const getAppropriateTimeInterval = useCallback((visibleDuration: number) => {
    if (visibleDuration <= 10) return 1; // 1 second
    if (visibleDuration <= 30) return 5; // 5 seconds
    if (visibleDuration <= 120) return 10; // 10 seconds
    if (visibleDuration <= 300) return 30; // 30 seconds
    if (visibleDuration <= 1800) return 60; // 1 minute
    return 300; // 5 minutes
  }, []);
  
  // Handle timeline interactions
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Calculate time from x position
    const visibleDuration = visibleTimeRange.end - visibleTimeRange.start;
    const clickedTime = visibleTimeRange.start + (x / rect.width) * visibleDuration;
    
    // Find if we clicked near a marker
    const pixelsPerSecond = rect.width / visibleDuration;
    const clickPrecision = 5 / pixelsPerSecond; // 5 pixels in time units
    
    if (markers && markers.length > 0) {
      // Find closest marker
      let closestMarker = null;
      let closestDistance = Number.MAX_VALUE;
      
      for (const marker of markers) {
        const distance = Math.abs(marker.time - clickedTime);
        if (distance < clickPrecision && distance < closestDistance) {
          closestMarker = marker;
          closestDistance = distance;
        }
      }
      
      if (closestMarker) {
        setSelectedMarker(closestMarker);
        if (onMarkerSelect) {
          onMarkerSelect(closestMarker);
        }
        if (onTimeChange) {
          onTimeChange(closestMarker.time);
        }
        return;
      }
    }
    
    // If not clicking a marker, just update time
    if (onTimeChange) {
      onTimeChange(clickedTime);
    }
  }, [visibleTimeRange, duration, markers, onMarkerSelect, onTimeChange]);
  
  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    
    // Prevent text selection during drag
    e.preventDefault();
  }, []);
  
  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current) return;
    
    const deltaX = e.clientX - dragStartX;
    const rect = timelineRef.current.getBoundingClientRect();
    const visibleDuration = visibleTimeRange.end - visibleTimeRange.start;
    const timeDelta = -(deltaX / rect.width) * visibleDuration;
    
    // Calculate new view start time
    const newStartTime = Math.max(0, viewStartTime + timeDelta);
    const newEndTime = newStartTime + visibleDuration;
    
    // Ensure we don't scroll past the end
    if (newEndTime <= duration) {
      setViewStartTime(newStartTime);
    }
    
    setDragStartX(e.clientX);
  }, [isDragging, dragStartX, visibleTimeRange, viewStartTime, duration]);
  
  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Prevent page scrolling
    e.preventDefault();
    
    if (duration === 0) return;
    
    // Calculate zoom factor
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 1), 20);
    
    if (newZoom !== zoom) {
      // Calculate the time at the mouse position before zooming
      const rect = timelineRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const visibleDuration = visibleTimeRange.end - visibleTimeRange.start;
        const mouseTimeOffset = (mouseX / rect.width) * visibleDuration;
        const mouseTime = visibleTimeRange.start + mouseTimeOffset;
        
        // Calculate new visible duration
        const newVisibleDuration = duration / newZoom;
        
        // Calculate new start time to keep mouse position at the same time point
        const newStartTime = Math.max(
          0,
          mouseTime - (mouseX / rect.width) * newVisibleDuration
        );
        
        // Ensure we don't scroll past the end
        const adjustedStartTime = Math.min(
          newStartTime,
          duration - newVisibleDuration
        );
        
        setViewStartTime(adjustedStartTime);
        setZoom(newZoom);
      }
    }
  }, [zoom, duration, visibleTimeRange]);
  
  // Handle play/pause toggle
  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      // Start playing
      if (videoRef.current) {
        videoRef.current.play();
      }
      if (audioRef.current) {
        audioRef.current.play();
      }
    } else {
      // Pause
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width, height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Media elements (hidden) */}
      {loadedVideoFile && (
        <video
          ref={videoRef}
          src={loadedVideoFile.blobUrl}
          style={{ display: 'none' }}
          preload="auto"
        />
      )}
      
      {loadedAudioFile && (
        <audio
          ref={audioRef}
          src={loadedAudioFile.blobUrl}
          style={{ display: 'none' }}
          preload="auto"
        />
      )}
      
      {/* Timeline controls */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <button
            className={`p-1 rounded ${isPlaying ? 'bg-gray-600' : 'bg-purple-600'}`}
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>
          
          <div className="text-xs text-gray-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="p-1 rounded bg-gray-700"
            onClick={() => setZoom(Math.max(zoom / 1.5, 1))}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          
          <div className="text-xs text-gray-400">
            {Math.round(zoom * 100)}%
          </div>
          
          <button
            className="p-1 rounded bg-gray-700"
            onClick={() => setZoom(Math.min(zoom * 1.5, 20))}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Timeline area */}
      <div
        ref={timelineRef}
        className="relative w-full bg-gray-900 rounded cursor-pointer select-none"
        style={{ height: 'calc(100% - 30px)' }}
        onClick={handleTimelineClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          width={timelineWidth}
          height={typeof height === 'number' ? height - 30 : 170}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

// Helper function to format time as MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export default VideoTimeline;