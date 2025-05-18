
import { ProcessingStage } from '../components/common/ProcessingProgress';

// Audio processing stages
export const AUDIO_PROCESSING_STAGES: ProcessingStage[] = [
  { id: 'loading', label: 'Loading Audio', percentage: 10 },
  { id: 'waveform', label: 'Extracting Waveform', percentage: 20 },
  { id: 'beats', label: 'Detecting Beats', percentage: 25 },
  { id: 'energy', label: 'Analyzing Energy', percentage: 20 },
  { id: 'tempo', label: 'Estimating Tempo', percentage: 15 },
  { id: 'sections', label: 'Detecting Sections', percentage: 10 }
];

// Video processing stages
export const VIDEO_PROCESSING_STAGES: ProcessingStage[] = [
  { id: 'loading', label: 'Loading Video', percentage: 10 },
  { id: 'frames', label: 'Extracting Frames', percentage: 20 },
  { id: 'scenes', label: 'Detecting Scenes', percentage: 30 },
  { id: 'content', label: 'Analyzing Content', percentage: 25 },
  { id: 'motion', label: 'Analyzing Motion', percentage: 15 }
];

// Helper function to map service progress to component props
export const mapAudioProgressToProps = (
  progress: number,
  step: string,
  error: string | null = null,
  isComplete = false
) => {
  // Map the step string to one of our defined stage IDs
  let currentStage = 'loading';
  
  if (step.includes('Loading')) currentStage = 'loading';
  else if (step.includes('waveform')) currentStage = 'waveform';
  else if (step.includes('beats')) currentStage = 'beats';
  else if (step.includes('energy')) currentStage = 'energy';
  else if (step.includes('tempo')) currentStage = 'tempo';
  else if (step.includes('sections')) currentStage = 'sections';
  
  return {
    stages: AUDIO_PROCESSING_STAGES,
    currentStage,
    progress,
    error,
    isComplete
  };
};

export const mapVideoProgressToProps = (
  progress: number,
  message: string,
  error: string | null = null,
  isComplete = false
) => {
  // Map the message string to one of our defined stage IDs
  let currentStage = 'loading';
  
  if (message.includes('Loading')) currentStage = 'loading';
  else if (message.includes('frames')) currentStage = 'frames';
  else if (message.includes('scene')) currentStage = 'scenes';
  else if (message.includes('content')) currentStage = 'content';
  else if (message.includes('motion')) currentStage = 'motion';
  
  return {
    stages: VIDEO_PROCESSING_STAGES,
    currentStage,
    progress: progress * 100, // Convert from 0-1 to 0-100
    error,
    isComplete
  };
};
