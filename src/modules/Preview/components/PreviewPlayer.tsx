
import React, { forwardRef, useEffect, useState, useImperativeHandle } from 'react';
import ReactPlayer from 'react-player';
import { EditDecisionList, MatchedClip, Transition, TransitionType } from '../../../types/EditDecision';

export interface PreviewPlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  getSecondsLoaded: () => number;
}

interface PreviewPlayerProps {
  /** The edit decision list to preview */
  editDecisionList: EditDecisionList;
  /** Current playback time in seconds */
  currentTime: number;
  /** Whether the player is currently playing */
  isPlaying: boolean;
  /** Playback rate (1.0 = normal speed) */
  playbackRate: number;
  /** Optional className for styling */
  className?: string;
}

/**
 * Frame-accurate preview player component for visualizing edit decisions
 */
const PreviewPlayer = forwardRef<PreviewPlayerRef, PreviewPlayerProps>(
  ({ editDecisionList, currentTime, isPlaying, playbackRate, className = '' }, ref) => {
    const [playerRef, setPlayerRef] = useState<ReactPlayer | null>(null);
    const [currentClip, setCurrentClip] = useState<MatchedClip | null>(null);
    const [currentTransition, setCurrentTransition] = useState<Transition | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [videoStartTime, setVideoStartTime] = useState(0);
    const [videoEndTime, setVideoEndTime] = useState(0);
    const [transitionActive, setTransitionActive] = useState(false);
    
    // Expose player methods via ref
    useImperativeHandle(ref, () => ({
      play: () => playerRef?.getInternalPlayer()?.play(),
      pause: () => playerRef?.getInternalPlayer()?.pause(),
      seekTo: (time: number) => playerRef?.seekTo(time, 'seconds'),
      getDuration: () => playerRef?.getDuration() || 0,
      getCurrentTime: () => playerRef?.getCurrentTime() || 0,
      getSecondsLoaded: () => playerRef?.getSecondsLoaded() || 0,
    }));
    
    // Find the current clip and transition based on current time
    useEffect(() => {
      if (!editDecisionList || !editDecisionList.clips) return;
      
      // Find the current clip
      const clip = editDecisionList.clips.find(c => 
        currentTime >= Number(c.timelineInPoint) && 
        currentTime < Number(c.timelineOutPoint)
      );
      
      // Find the current transition
      const transition = editDecisionList.transitions.find(t => {
        const transitionStart = Number(t.centerPoint) - (Number(t.duration) / 2);
        const transitionEnd = Number(t.centerPoint) + (Number(t.duration) / 2);
        return currentTime >= transitionStart && currentTime <= transitionEnd;
      });
      
      setCurrentClip(clip || null);
      setCurrentTransition(transition || null);
      setTransitionActive(!!transition);
      
      // Update video URL and timing if clip changed
      if (clip && clip !== currentClip) {
        // In a real implementation, this would resolve the actual video URL
        // based on the clip's sourceId
        setVideoUrl(`/media/${clip.sourceId}`);
        
        // Calculate the time within the source video
        const timelineOffset = currentTime - Number(clip.timelineInPoint);
        const sourceTime = Number(clip.sourceInPoint) + timelineOffset;
        
        setVideoStartTime(Number(clip.sourceInPoint));
        setVideoEndTime(Number(clip.sourceOutPoint));
      }
    }, [editDecisionList, currentTime, currentClip]);
    
    // Handle transition rendering
    const renderTransition = () => {
      if (!transitionActive || !currentTransition) return null;
      
      // In a real implementation, this would render different transition effects
      // based on the transition type
      const transitionStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
      };
      
      switch (currentTransition.type) {
        case TransitionType.DISSOLVE:
          return <div style={{ ...transitionStyle, background: 'rgba(0,0,0,0.5)' }} />;
        case TransitionType.FADE_IN:
          return <div style={{ ...transitionStyle, background: 'rgba(0,0,0,0.8)' }} />;
        case TransitionType.FADE_OUT:
          return <div style={{ ...transitionStyle, background: 'rgba(0,0,0,0.8)' }} />;
        case TransitionType.WIPE:
          return <div style={{ ...transitionStyle, background: 'linear-gradient(to right, transparent, black)' }} />;
        case TransitionType.DIP_TO_BLACK:
          return <div style={{ ...transitionStyle, background: 'black' }} />;
        case TransitionType.DIP_TO_WHITE:
          return <div style={{ ...transitionStyle, background: 'white' }} />;
        default:
          return null;
      }
    };
    
    return (
      <div className={`preview-player ${className}`} style={{ position: 'relative' }}>
        {videoUrl ? (
          <ReactPlayer
            ref={setPlayerRef}
            url={videoUrl}
            playing={isPlaying}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            progressInterval={33} // ~30fps updates for frame accuracy
            onProgress={({ playedSeconds }) => {
              // Handle looping within the clip boundaries
              if (playedSeconds > videoEndTime) {
                playerRef?.seekTo(videoStartTime, 'seconds');
              }
            }}
            config={{
              file: {
                attributes: {
                  crossOrigin: 'anonymous',
                  controlsList: 'nodownload',
                },
              },
            }}
          />
        ) : (
          <div className="preview-player-placeholder">
            <p>No clip selected</p>
          </div>
        )}
        
        {renderTransition()}
        
        {/* Frame counter overlay */}
        <div className="frame-counter">
          Frame: {Math.floor(currentTime * editDecisionList.framerate)} / 
          {Math.floor((editDecisionList.totalDuration as number) * editDecisionList.framerate)}
        </div>
      </div>
    );
  }
);

export default PreviewPlayer;
