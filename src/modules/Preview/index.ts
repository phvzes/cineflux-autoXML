
/**
 * Preview Module for CineFlux-AutoXML
 * 
 * This module provides frame-accurate preview functionality for edit decisions,
 * including playback controls, timeline scrubbing, and transition previews.
 */

// Main module component
export { default as PreviewModule } from './PreviewModule';

// Components
export { default as PreviewPlayer } from './components/PreviewPlayer';
export { default as TimelineScrubber } from './components/TimelineScrubber';
export { default as PlaybackControls } from './components/PlaybackControls';
export { default as AudioWaveform } from './components/AudioWaveform';
export { default as TransitionPreview } from './components/TransitionPreview';
export { default as EditMarkers } from './components/EditMarkers';

// Hooks
export { default as usePreview } from './hooks/usePreview';
export { default as useFrameNavigation } from './hooks/useFrameNavigation';
export { default as useAudioWaveform } from './hooks/useAudioWaveform';
