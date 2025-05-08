// src/components/edit-decision/EditPreview.tsx
import React, { useEffect, useRef, useState } from 'react';
import { EditDecisionList, MatchedClip, Transition, TransitionType } from '../../types/EditDecision';

interface EditPreviewProps {
  /** The edit decision list to preview */
  edl: EditDecisionList;
  /** Map of video sources by ID */
  videoSources: Record<string, string>;
  /** Width of the preview in pixels */
  width?: number;
  /** Height of the preview in pixels */
  height?: number;
  /** Whether to autoplay the preview */
  autoplay?: boolean;
  /** Whether to loop the preview */
  loop?: boolean;
  /** Callback when playback position changes */
  onTimeUpdate?: (currentTime: number) => void;
  /** Callback when playback ends */
  onEnded?: () => void;
}

/**
 * Component for previewing an edit decision list with video playback
 */
const EditPreview: React.FC<EditPreviewProps> = ({
  edl,
  videoSources,
  width = 640,
  height = 360,
  autoplay = false,
  loop = false,
  onTimeUpdate,
  onEnded
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  // Calculate the total duration of the edit
  const totalDuration = edl.clips.length > 0
    ? Math.max(...edl.clips.map(clip => clip.timelineOutPoint as number))
    : 0;
  
  // Initialize video elements for each source
  useEffect(() => {
    // Clean up previous video elements
    Object.values(videoRefs.current).forEach(video => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
    
    videoRefs.current = {};
    
    // Create new video elements for each source
    Object.entries(videoSources).forEach(([sourceId, url]) => {
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      video.muted = true; // Mute to allow autoplay
      
      // Add to refs
      videoRefs.current[sourceId] = video;
      
      // Load the video
      video.load();
    });
    
    // Clean up on unmount
    return () => {
      Object.values(videoRefs.current).forEach(video => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      });
    };
  }, [videoSources]);
  
  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      // Start playback
      startTimeRef.current = performance.now() - (currentTime * 1000);
      lastFrameTimeRef.current = performance.now();
      
      const animate = (time: number) => {
        // Calculate the current playback time
        const elapsedMs = time - startTimeRef.current;
        const newTime = elapsedMs / 1000;
        
        // Check if we've reached the end
        if (newTime >= totalDuration) {
          if (loop) {
            // Loop back to the beginning
            startTimeRef.current = time;
            setCurrentTime(0);
          } else {
            // Stop playback
            setIsPlaying(false);
            setCurrentTime(totalDuration);
            if (onEnded) onEnded();
            return;
          }
        } else {
          setCurrentTime(newTime);
          if (onTimeUpdate) onTimeUpdate(newTime);
        }
        
        // Request the next frame
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Stop playback
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, currentTime, totalDuration, loop, onTimeUpdate, onEnded]);
  
  // Render the current frame to the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Find the current clip and any active transition
    const currentClip = findClipAtTime(edl.clips, currentTime);
    const activeTransition = findTransitionAtTime(edl.transitions, currentTime);
    
    if (currentClip) {
      // Calculate the source time for the current clip
      const clipTime = currentTime - (currentClip.timelineInPoint as number);
      const sourceTime = (currentClip.sourceInPoint as number) + clipTime;
      
      // Get the video element for this clip
      const video = videoRefs.current[currentClip.sourceId];
      
      if (video) {
        // Seek the video to the correct time
        if (Math.abs(video.currentTime - sourceTime) > 0.1) {
          video.currentTime = sourceTime;
        }
        
        // Draw the video frame to the canvas
        ctx.drawImage(video, 0, 0, width, height);
      } else {
        // Draw a placeholder if the video isn't available
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Source not available: ${currentClip.sourceId}`, width / 2, height / 2);
      }
    }
    
    // Handle transitions
    if (activeTransition) {
      const outgoingClip = edl.clips.find(clip => clip.id === activeTransition.outgoingClipId);
      const incomingClip = edl.clips.find(clip => clip.id === activeTransition.incomingClipId);
      
      if (outgoingClip && incomingClip) {
        // Calculate the progress of the transition (0-1)
        const transitionStart = (activeTransition.centerPoint as number) - (activeTransition.duration as number) / 2;
        const transitionEnd = (activeTransition.centerPoint as number) + (activeTransition.duration as number) / 2;
        const progress = (currentTime - transitionStart) / (transitionEnd - transitionStart);
        
        // Calculate source times for both clips
        const outgoingTime = currentTime - (outgoingClip.timelineInPoint as number) + (outgoingClip.sourceInPoint as number);
        const incomingTime = currentTime - (incomingClip.timelineInPoint as number) + (incomingClip.sourceInPoint as number);
        
        // Get video elements
        const outgoingVideo = videoRefs.current[outgoingClip.sourceId];
        const incomingVideo = videoRefs.current[incomingClip.sourceId];
        
        if (outgoingVideo && incomingVideo) {
          // Seek videos to correct times
          if (Math.abs(outgoingVideo.currentTime - outgoingTime) > 0.1) {
            outgoingVideo.currentTime = outgoingTime;
          }
          
          if (Math.abs(incomingVideo.currentTime - incomingTime) > 0.1) {
            incomingVideo.currentTime = incomingTime;
          }
          
          // Apply the transition effect
          switch (activeTransition.type) {
            case TransitionType.DISSOLVE:
              // Draw the outgoing clip with reduced opacity
              ctx.globalAlpha = 1 - progress;
              ctx.drawImage(outgoingVideo, 0, 0, width, height);
              
              // Draw the incoming clip with increasing opacity
              ctx.globalAlpha = progress;
              ctx.drawImage(incomingVideo, 0, 0, width, height);
              
              // Reset alpha
              ctx.globalAlpha = 1;
              break;
              
            case TransitionType.FADE_IN:
              // Draw the incoming clip with increasing opacity
              ctx.globalAlpha = progress;
              ctx.drawImage(incomingVideo, 0, 0, width, height);
              
              // Reset alpha
              ctx.globalAlpha = 1;
              break;
              
            case TransitionType.FADE_OUT:
              // Draw the outgoing clip with decreasing opacity
              ctx.globalAlpha = 1 - progress;
              ctx.drawImage(outgoingVideo, 0, 0, width, height);
              
              // Reset alpha
              ctx.globalAlpha = 1;
              break;
              
            case TransitionType.WIPE:
              // Draw the outgoing clip
              ctx.drawImage(outgoingVideo, 0, 0, width, height);
              
              // Create a clipping region for the wipe
              ctx.beginPath();
              ctx.rect(0, 0, width * progress, height);
              ctx.clip();
              
              // Draw the incoming clip in the clipped region
              ctx.drawImage(incomingVideo, 0, 0, width, height);
              
              // Reset the clipping region
              ctx.restore();
              break;
              
            case TransitionType.DIP_TO_BLACK:
              if (progress < 0.5) {
                // First half: fade out to black
                ctx.globalAlpha = 1 - (progress * 2);
                ctx.drawImage(outgoingVideo, 0, 0, width, height);
              } else {
                // Second half: fade in from black
                ctx.globalAlpha = (progress - 0.5) * 2;
                ctx.drawImage(incomingVideo, 0, 0, width, height);
              }
              
              // Reset alpha
              ctx.globalAlpha = 1;
              break;
              
            default:
              // Default to a simple cut
              ctx.drawImage(incomingVideo, 0, 0, width, height);
              break;
          }
        }
      }
    }
    
    // Draw timecode
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 100, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatTimecode(currentTime), 10, 20);
    
  }, [currentTime, edl.clips, edl.transitions, width, height, videoSources]);
  
  // Find the clip that contains the given time
  const findClipAtTime = (clips: MatchedClip[], time: number): MatchedClip | undefined => {
    return clips.find(clip => 
      time >= (clip.timelineInPoint as number) && 
      time < (clip.timelineOutPoint as number)
    );
  };
  
  // Find a transition that is active at the given time
  const findTransitionAtTime = (transitions: Transition[], time: number): Transition | undefined => {
    return transitions.find(transition => {
      const duration = transition.duration as number;
      const center = transition.centerPoint as number;
      const start = center - duration / 2;
      const end = center + duration / 2;
      
      return time >= start && time <= end;
    });
  };
  
  // Format a time in seconds as a timecode (HH:MM:SS:FF)
  const formatTimecode = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * edl.framerate);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };
  
  // Handle play/pause toggle
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (isPlaying) {
      // Update the start time to maintain playback
      startTimeRef.current = performance.now() - (newTime * 1000);
    }
    
    if (onTimeUpdate) onTimeUpdate(newTime);
  };
  
  return (
    <div className="edit-preview" style={{ width }}>
      <div className="preview-canvas-container" style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={togglePlayPause}
          style={{ cursor: 'pointer', backgroundColor: '#000' }}
        />
        
        {!isPlaying && (
          <div 
            className="play-overlay"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={togglePlayPause}
          >
            <div 
              style={{
                width: '0',
                height: '0',
                borderTop: '15px solid transparent',
                borderBottom: '15px solid transparent',
                borderLeft: '25px solid white',
                marginLeft: '5px'
              }}
            />
          </div>
        )}
      </div>
      
      <div className="preview-controls" style={{ marginTop: '10px' }}>
        <button 
          onClick={togglePlayPause}
          style={{
            padding: '5px 10px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <input
          type="range"
          min="0"
          max={totalDuration}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          style={{ width: 'calc(100% - 120px)' }}
        />
        
        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
          {formatTimecode(currentTime)}
        </span>
      </div>
    </div>
  );
};

export default EditPreview;
