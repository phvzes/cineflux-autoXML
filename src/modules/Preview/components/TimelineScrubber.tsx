
import React, { useRef, useEffect, useState } from 'react';
import { EditDecisionList } from '../../../types/EditDecision';

interface TimelineScrubberProps {
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Framerate of the video */
  framerate: number;
  /** Edit decision list for visualizing cut points */
  editDecisionList: EditDecisionList;
  /** Callback when seeking to a specific time */
  onSeek: (time: number) => void;
  /** Callback when seeking to a specific frame */
  onFrameSeek: (frame: number) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Timeline scrubber component with frame-level precision
 */
const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTime,
  duration,
  framerate,
  editDecisionList,
  onSeek,
  onFrameSeek,
  className = '',
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverFrame, setHoverFrame] = useState<number | null>(null);
  
  // Calculate current progress percentage
  const progressPercentage = (currentTime / duration) * 100;
  
  // Handle timeline click/drag
  const handleTimelineInteraction = (clientX: number) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
    const newTime = percentage * duration;
    
    onSeek(newTime);
  };
  
  // Handle mouse down on timeline
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleTimelineInteraction(e.clientX);
  };
  
  // Handle mouse move on timeline
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
    const time = percentage * duration;
    const frame = Math.floor(time * framerate);
    
    setHoverTime(time);
    setHoverFrame(frame);
    
    if (isDragging) {
      handleTimelineInteraction(e.clientX);
    }
  };
  
  // Handle mouse up (end dragging)
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoverTime(null);
    setHoverFrame(null);
    if (isDragging) {
      setIsDragging(false);
    }
  };
  
  // Add global mouse up event listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);
  
  // Format time as MM:SS.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };
  
  // Render cut points on the timeline
  const renderCutPoints = () => {
    return editDecisionList.cutPoints.map((cutPoint) => {
      const position = (Number(cutPoint.position) / duration) * 100;
      return (
        <div
          key={cutPoint.id}
          className="timeline-cut-point"
          style={{
            left: `${position}%`,
            backgroundColor: cutPoint.color || '#ff0000',
          }}
          title={cutPoint.label || `Cut point at ${formatTime(Number(cutPoint.position))}`}
        />
      );
    });
  };
  
  // Render transitions on the timeline
  const renderTransitions = () => {
    return editDecisionList.transitions.map((transition) => {
      const centerPosition = (Number(transition.centerPoint) / duration) * 100;
      const halfDurationPercentage = ((Number(transition.duration) / 2) / duration) * 100;
      
      return (
        <div
          key={transition.id}
          className="timeline-transition"
          style={{
            left: `${centerPosition - halfDurationPercentage}%`,
            width: `${halfDurationPercentage * 2}%`,
          }}
          title={`${transition.type} transition at ${formatTime(Number(transition.centerPoint))}`}
        />
      );
    });
  };
  
  return (
    <div className={`timeline-scrubber ${className}`}>
      <div
        ref={timelineRef}
        className="timeline"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Timeline background */}
        <div className="timeline-background" />
        
        {/* Cut points */}
        {renderCutPoints()}
        
        {/* Transitions */}
        {renderTransitions()}
        
        {/* Progress bar */}
        <div
          className="timeline-progress"
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Playhead */}
        <div
          className="timeline-playhead"
          style={{ left: `${progressPercentage}%` }}
        />
        
        {/* Hover indicator */}
        {hoverTime !== null && (
          <div
            className="timeline-hover-indicator"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          />
        )}
      </div>
      
      {/* Time and frame display */}
      <div className="timeline-info">
        <div className="current-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className="current-frame">
          Frame: {Math.floor(currentTime * framerate)} / {Math.floor(duration * framerate)}
        </div>
        
        {/* Hover time/frame display */}
        {hoverTime !== null && hoverFrame !== null && (
          <div className="hover-time">
            Hover: {formatTime(hoverTime)} (Frame {hoverFrame})
          </div>
        )}
        
        {/* Frame navigation input */}
        <div className="frame-navigation">
          <label htmlFor="frame-input">Go to frame:</label>
          <input
            id="frame-input"
            type="number"
            min={0}
            max={Math.floor(duration * framerate)}
            value={Math.floor(currentTime * framerate)}
            onChange={(e) => {
              const frame = parseInt(e.target.value, 10);
              if (!isNaN(frame)) {
                onFrameSeek(frame);
              }
            }}
          />
          <button
            onClick={() => {
              const frameInput = document.getElementById('frame-input') as HTMLInputElement;
              const frame = parseInt(frameInput.value, 10);
              if (!isNaN(frame)) {
                onFrameSeek(frame);
              }
            }}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineScrubber;
