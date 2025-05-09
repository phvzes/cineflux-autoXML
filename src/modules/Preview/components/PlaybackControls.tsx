
import React from 'react';

interface PlaybackControlsProps {
  /** Whether the player is currently playing */
  isPlaying: boolean;
  /** Current playback rate (1.0 = normal speed) */
  playbackRate: number;
  /** Current frame number */
  currentFrame: number;
  /** Total number of frames */
  totalFrames: number;
  /** Callback when play button is clicked */
  onPlay: () => void;
  /** Callback when pause button is clicked */
  onPause: () => void;
  /** Callback when playback rate is changed */
  onPlaybackRateChange: (rate: number) => void;
  /** Callback when next frame button is clicked */
  onNextFrame: () => void;
  /** Callback when previous frame button is clicked */
  onPrevFrame: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Playback controls component for the preview player
 */
const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  playbackRate,
  currentFrame,
  totalFrames,
  onPlay,
  onPause,
  onPlaybackRateChange,
  onNextFrame,
  onPrevFrame,
  className = '',
}) => {
  // Available playback rates
  const playbackRates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  
  return (
    <div className={`playback-controls ${className}`}>
      <div className="playback-buttons">
        {/* Play/Pause button */}
        <button
          className="playback-button"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        {/* Frame navigation buttons */}
        <button
          className="frame-button"
          onClick={onPrevFrame}
          aria-label="Previous Frame"
        >
          ⏮️
        </button>
        
        <button
          className="frame-button"
          onClick={onNextFrame}
          aria-label="Next Frame"
        >
          ⏭️
        </button>
        
        {/* Frame counter */}
        <div className="frame-counter">
          Frame: {currentFrame} / {totalFrames}
        </div>
      </div>
      
      <div className="playback-rate-controls">
        <label htmlFor="playback-rate">Speed:</label>
        <select
          id="playback-rate"
          value={playbackRate}
          onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
        >
          {playbackRates.map((rate) => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PlaybackControls;
