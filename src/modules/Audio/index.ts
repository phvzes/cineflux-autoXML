/**
 * Audio Analysis Module for CineFlux-AutoXML
 * 
 * This module provides audio analysis functionality including beat detection,
 * waveform visualization, amplitude/frequency analysis, and feature extraction.
 */

// Main module component
export { default as AudioModule } from './AudioModule';

// Components
export { default as WaveformCanvas } from './components/WaveformCanvas';
export { default as WaveSurferWrapper } from './components/WaveSurferWrapper';
export { default as BeatAnalysisDisplay } from './components/BeatAnalysisDisplay';
export { default as EnergyAnalysisDisplay } from './components/EnergyAnalysisDisplay';

// Hooks
export { default as useAudioAnalysis } from './hooks/useAudioAnalysis';

// Services
export { default as audioAnalysisService } from './services/audioAnalysisService';
export { AudioServiceEvents } from './services/audioAnalysisService';

// Worker types
export { WorkerTaskType, WorkerResponseType } from './workers/audioAnalysisWorker';
