
import React, { useEffect, useRef, useState } from 'react';
import { Transition, TransitionType } from '../../types/EditDecision';

interface TransitionPreviewProps {
  /** The transition to preview */
  transition: Transition;
  /** Source URL for the outgoing clip */
  outgoingSrc: string;
  /** Source URL for the incoming clip */
  incomingSrc: string;
  /** Width of the preview */
  width?: number;
  /** Height of the preview */
  height?: number;
  /** Current time relative to the transition center point */
  currentTime: number;
  /** Callback when the preview is ready */
  onReady?: () => void;
}

/**
 * Component for previewing transitions between clips
 */
const TransitionPreview: React.FC<TransitionPreviewProps> = ({
  transition,
  outgoingSrc,
  incomingSrc,
  width = 320,
  height = 180,
  currentTime,
  onReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outgoingVideoRef = useRef<HTMLVideoElement>(null);
  const incomingVideoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(0);
  
  // Calculate transition parameters
  const transitionDuration = typeof transition.duration === 'number' ? transition.duration : 1.0;
  const transitionCenter = typeof transition.centerPoint === 'number' ? transition.centerPoint : 0;
  const transitionStart = transitionCenter - transitionDuration / 2;
  const transitionEnd = transitionCenter + transitionDuration / 2;
  
  // Calculate progress of the transition (0-1)
  const relativeTime = currentTime - transitionStart;
  const progress = Math.max(0, Math.min(1, relativeTime / transitionDuration));
  
  // Load videos
  useEffect(() => {
    if (!outgoingVideoRef.current || !incomingVideoRef.current) return;
    
    const outgoingVideo = outgoingVideoRef.current;
    const incomingVideo = incomingVideoRef.current;
    
    // Reset loaded count
    setVideosLoaded(0);
    setIsReady(false);
    
    // Set up event listeners
    const handleVideoLoaded = () => {
      setVideosLoaded(prev => {
        const newCount = prev + 1;
        if (newCount === 2) {
          setIsReady(true);
          if (onReady) onReady();
        }
        return newCount;
      });
    };
    
    outgoingVideo.addEventListener('loadeddata', handleVideoLoaded);
    incomingVideo.addEventListener('loadeddata', handleVideoLoaded);
    
    // Load videos
    outgoingVideo.src = outgoingSrc;
    outgoingVideo.load();
    
    incomingVideo.src = incomingSrc;
    incomingVideo.load();
    
    // Clean up
    return () => {
      outgoingVideo.removeEventListener('loadeddata', handleVideoLoaded);
      incomingVideo.removeEventListener('loadeddata', handleVideoLoaded);
      
      outgoingVideo.pause();
      incomingVideo.pause();
      
      outgoingVideo.src = '';
      incomingVideo.src = '';
    };
  }, [outgoingSrc, incomingSrc, onReady]);
  
  // Render the transition
  useEffect(() => {
    if (!canvasRef.current || !isReady) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const outgoingVideo = outgoingVideoRef.current;
    const incomingVideo = incomingVideoRef.current;
    if (!outgoingVideo || !incomingVideo) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply the transition effect
    switch (transition.type) {
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
        ctx.save();
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
        if (progress < 0.5) {
          ctx.drawImage(outgoingVideo, 0, 0, width, height);
        } else {
          ctx.drawImage(incomingVideo, 0, 0, width, height);
        }
        break;
    }
    
    // Draw progress indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, height - 20, width, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${transition.type} (${Math.round(progress * 100)}%)`, width / 2, height - 6);
    
  }, [isReady, progress, transition.type, width, height]);
  
  // Seek videos to the correct time
  useEffect(() => {
    if (!isReady) return;
    
    const outgoingVideo = outgoingVideoRef.current;
    const incomingVideo = incomingVideoRef.current;
    if (!outgoingVideo || !incomingVideo) return;
    
    // Calculate source times for both clips
    // This is a simplified version - in a real implementation, you would
    // calculate the actual source times based on the clip in/out points
    const outgoingTime = Math.max(0, relativeTime);
    const incomingTime = Math.max(0, relativeTime);
    
    // Seek videos to correct times
    if (Math.abs(outgoingVideo.currentTime - outgoingTime) > 0.1) {
      outgoingVideo.currentTime = outgoingTime;
    }
    
    if (Math.abs(incomingVideo.currentTime - incomingTime) > 0.1) {
      incomingVideo.currentTime = incomingTime;
    }
  }, [isReady, relativeTime]);
  
  return (
    <div className="transition-preview" style={{ width, height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ backgroundColor: '#000' }}
      />
      
      {/* Hidden video elements for rendering */}
      <video
        ref={outgoingVideoRef}
        style={{ display: 'none' }}
        preload="auto"
        muted
        playsInline
      />
      <video
        ref={incomingVideoRef}
        style={{ display: 'none' }}
        preload="auto"
        muted
        playsInline
      />
      
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            fontSize: '14px'
          }}
        >
          Loading transition preview... ({videosLoaded}/2)
        </div>
      )}
    </div>
  );
};

export default TransitionPreview;
