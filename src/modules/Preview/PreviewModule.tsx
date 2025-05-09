
import React, { useState, useEffect, useCallback } from 'react';
import { EditDecisionList, MatchedClip, Transition } from '../../types/EditDecision';
import PreviewPlayer from './components/PreviewPlayer';
import TimelineScrubber from './components/TimelineScrubber';
import PlaybackControls from './components/PlaybackControls';
import AudioWaveform from './components/AudioWaveform';
import EditMarkers from './components/EditMarkers';
import TransitionPreview from './components/TransitionPreview';
import usePreview from './hooks/usePreview';

interface PreviewModuleProps {
  /** The edit decision list to preview */
  editDecisionList: EditDecisionList;
  /** Audio file URL for waveform visualization */
  audioUrl?: string;
  /** Optional callback when a clip is selected */
  onClipSelect?: (clip: MatchedClip) => void;
  /** Optional callback when a transition is selected */
  onTransitionSelect?: (transition: Transition) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Preview Module for visualizing and playing back edit decisions
 */
const PreviewModule: React.FC<PreviewModuleProps> = ({
  editDecisionList,
  audioUrl,
  onClipSelect,
  onTransitionSelect,
  className = '',
}) => {
  const {
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    currentFrame,
    totalFrames,
    playerRef,
    waveformRef,
    play,
    pause,
    seek,
    seekToFrame,
    setPlaybackRate,
    nextFrame,
    prevFrame,
    getCurrentClip,
    getCurrentTransition,
  } = usePreview(editDecisionList);

  // Handle clip selection
  const handleClipClick = useCallback((clip: MatchedClip) => {
    seek(Number(clip.timelineInPoint));
    onClipSelect?.(clip);
  }, [seek, onClipSelect]);

  // Handle transition selection
  const handleTransitionClick = useCallback((transition: Transition) => {
    seek(Number(transition.centerPoint) - 0.5); // Start slightly before transition
    onTransitionSelect?.(transition);
  }, [seek, onTransitionSelect]);

  return (
    <div className={`preview-module ${className}`}>
      <div className="preview-player-container">
        <PreviewPlayer
          ref={playerRef}
          editDecisionList={editDecisionList}
          currentTime={currentTime}
          isPlaying={isPlaying}
          playbackRate={playbackRate}
        />
        
        <TransitionPreview
          transition={getCurrentTransition()}
          isVisible={!!getCurrentTransition()}
        />
      </div>
      
      <div className="preview-controls">
        <PlaybackControls
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          onPlay={play}
          onPause={pause}
          onPlaybackRateChange={setPlaybackRate}
          onNextFrame={nextFrame}
          onPrevFrame={prevFrame}
          currentFrame={currentFrame}
          totalFrames={totalFrames}
        />
      </div>
      
      <div className="preview-timeline">
        <TimelineScrubber
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          onFrameSeek={seekToFrame}
          editDecisionList={editDecisionList}
          framerate={editDecisionList.framerate}
        />
        
        <EditMarkers
          editDecisionList={editDecisionList}
          currentTime={currentTime}
          onClipClick={handleClipClick}
          onTransitionClick={handleTransitionClick}
        />
        
        {audioUrl && (
          <AudioWaveform
            ref={waveformRef}
            audioUrl={audioUrl}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
          />
        )}
      </div>
    </div>
  );
};

export default PreviewModule;
