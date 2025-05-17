
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PreviewPlayer from './PreviewPlayer';
import Waveform from './Waveform';
import TransitionPreview from './TransitionPreview';
import { EditDecisionList, TimelineCutPoint, Transition, MarkerType } from '../../types/EditDecision';
import { editDecisionEngine } from '../../engine/EditDecisionEngine';

// Import CSS
import '../../styles/preview-wrapper.css';

interface PreviewWrapperProps {
  /** The edit decision list to preview */
  edl: EditDecisionList;
  /** Map of video sources by ID */
  videoSources: Record<string, string>;
  /** Audio source URL */
  audioSrc?: string;
  /** Width of the preview in pixels */
  width?: number;
  /** Height of the preview in pixels */
  height?: number;
  /** Whether to autoplay the preview */
  autoplay?: boolean;
  /** Whether to loop the preview */
  loop?: boolean;
  /** Whether to show the waveform */
  showWaveform?: boolean;
  /** Whether to show transition previews */
  showTransitions?: boolean;
  /** Callback when playback position changes */
  onTimeUpdate?: (currentTime: number) => void;
  /** Callback when playback ends */
  onEnded?: () => void;
  /** Callback when a marker is clicked */
  onMarkerClick?: (marker: TimelineCutPoint) => void;
}

/**
 * Component that wraps the video player, waveform, and transition preview
 */
const PreviewWrapper: React.FC<PreviewWrapperProps> = ({
  edl,
  videoSources,
  audioSrc,
  width = 800,
  height = 450,
  autoplay = false,
  loop = false,
  showWaveform = true,
  showTransitions = true,
  onTimeUpdate,
  onEnded,
  onMarkerClick
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [currentClip, setCurrentClip] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [activeTransition, setActiveTransition] = useState<Transition | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const playerRef = useRef<any>(null);
  const waveformRef = useRef<any>(null);
  
  // Calculate the total duration of the edit
  const totalDuration = edl.clips.length > 0
    ? Math.max(...edl.clips.map(clip => typeof clip.timelineOutPoint === 'number' ? clip.timelineOutPoint : 0))
    : 0;
  
  // Create markers from EDL cut points and transitions
  const createMarkers = useCallback((): TimelineCutPoint[] => {
    const markers: TimelineCutPoint[] = [...edl.cutPoints];
    
    // Add markers for transitions
    edl.transitions.forEach(transition => {
      const centerPoint = typeof transition.centerPoint === 'number' ? transition.centerPoint : 0;
      const duration = typeof transition.duration === 'number' ? transition.duration : 0;
      const startTime = centerPoint - duration / 2;
      const endTime = centerPoint + duration / 2;
      
      // Add marker for transition start
      markers.push({
        id: `transition_start_${transition.id}`,
        type: MarkerType.IN,
        position: startTime,
        label: `${transition.type} Start`
      });
      
      // Add marker for transition end
      markers.push({
        id: `transition_end_${transition.id}`,
        type: MarkerType.OUT,
        position: endTime,
        label: `${transition.type} End`
      });
    });
    
    return markers;
  }, [edl.cutPoints, edl.transitions]);
  
  // Find the clip that contains the given time
  const findClipAtTime = useCallback((time: number) => {
    return edl.clips.find(clip => {
      const inPoint = typeof clip.timelineInPoint === 'number' ? clip.timelineInPoint : 0;
      const outPoint = typeof clip.timelineOutPoint === 'number' ? clip.timelineOutPoint : 0;
      return time >= inPoint && time < outPoint;
    });
  }, [edl.clips]);
  
  // Find a transition that is active at the given time
  const findTransitionAtTime = useCallback((time: number) => {
    return edl.transitions.find(transition => {
      const centerPoint = typeof transition.centerPoint === 'number' ? transition.centerPoint : 0;
      const duration = typeof transition.duration === 'number' ? transition.duration : 0;
      const startTime = centerPoint - duration / 2;
      const endTime = centerPoint + duration / 2;
      
      return time >= startTime && time <= endTime;
    });
  }, [edl.transitions]);
  
  // Handle time update from the player
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    
    // Find the current clip
    const clip = findClipAtTime(time);
    if (clip) {
      const clipId = clip.id;
      
      if (clipId !== currentClip) {
        setCurrentClip(clipId);
        
        // Update the current source
        const src = videoSources[clip.sourceId];
        if (src && src !== currentSrc) {
          setCurrentSrc(src);
        }
      }
    }
    
    // Find active transition
    const transition = findTransitionAtTime(time);
    setActiveTransition(transition);
    
    // Call the onTimeUpdate callback
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  }, [findClipAtTime, findTransitionAtTime, currentClip, currentSrc, videoSources, onTimeUpdate]);
  
  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  }, [isPlaying]);
  
  // Handle seeking
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
    
    if (waveformRef.current) {
      waveformRef.current.seekTo(time / totalDuration);
    }
  }, [totalDuration]);
  
  // Handle marker click
  const handleMarkerClick = useCallback((marker: TimelineCutPoint) => {
    const position = typeof marker.position === 'number' ? marker.position : 0;
    handleSeek(position);
    
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  }, [handleSeek, onMarkerClick]);
  
  // Set initial source
  useEffect(() => {
    if (edl.clips.length > 0) {
      const firstClip = edl.clips[0];
      const src = videoSources[firstClip.sourceId];
      
      if (src) {
        setCurrentSrc(src);
        setCurrentClip(firstClip.id);
      }
    }
  }, [edl.clips, videoSources]);
  
  // Calculate the waveform height
  const waveformHeight = 80;
  
  // Calculate the player height
  const playerHeight = showWaveform ? height - waveformHeight : height;
  
  return (
    <div className="preview-wrapper" style={{ width }}>
      <div className="preview-player-container">
        <PreviewPlayer
          src={currentSrc}
          width={width}
          height={playerHeight}
          fps={edl.framerate}
          autoplay={autoplay}
          loop={loop}
          markers={createMarkers()}
          onTimeUpdate={handleTimeUpdate}
          onEnded={onEnded}
          onMarkerClick={handleMarkerClick}
          onReady={(player) => {
            playerRef.current = player;
          }}
        />
      </div>
      
      {showWaveform && audioSrc && (
        <div className="preview-waveform-container">
          <Waveform
            src={audioSrc}
            width={width}
            height={waveformHeight}
            showTimeline={true}
            markers={createMarkers()}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            onMarkerClick={handleMarkerClick}
            onReady={(wavesurfer) => {
              waveformRef.current = wavesurfer;
            }}
          />
        </div>
      )}
      
      {showTransitions && activeTransition && (
        <div className="preview-transition-container">
          <h3>Active Transition: {activeTransition.type}</h3>
          <TransitionPreview
            transition={activeTransition}
            outgoingSrc={videoSources[edl.clips.find(clip => clip.id === activeTransition.outgoingClipId)?.sourceId || '']}
            incomingSrc={videoSources[edl.clips.find(clip => clip.id === activeTransition.incomingClipId)?.sourceId || '']}
            width={320}
            height={180}
            currentTime={currentTime}
          />
        </div>
      )}
      
      <div className="preview-controls">
        <button
          onClick={handlePlayPause}
          className="preview-control-button"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <input
          type="range"
          min="0"
          max={totalDuration}
          step="0.01"
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="preview-seek-slider"
        />
        
        <span className="preview-time-display">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
};

// Helper function to format time as MM:SS
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default PreviewWrapper;
