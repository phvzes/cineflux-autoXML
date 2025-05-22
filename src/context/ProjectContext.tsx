
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  AudioAnalysis, 
  VideoAnalysis, 
  EditDecision, 
  WorkflowStep, 
  ProjectSettings,
  VideoResolution,
  VideoCodec,
  AudioCodec
} from '@/types/consolidated';

// Define the project state interface
interface ProjectState {
  currentStep: WorkflowStep;
  musicFile: File | null;
  videoFiles: File[];
  isAnalyzing: boolean;
  analysisProgress: { progress: number; step: string };
  audioAnalysis: AudioAnalysis | null;
  videoAnalyses: Record<string, VideoAnalysis>;
  editDecisions: EditDecision[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  settings: ProjectSettings;
  showExportModal: boolean;
}

// Define action types
type ProjectAction =
  | { type: 'SET_STEP'; payload: WorkflowStep }
  | { type: 'SET_MUSIC_FILE'; payload: File | null }
  | { type: 'SET_VIDEO_FILES'; payload: File[] }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_ANALYSIS_PROGRESS'; payload: { progress: number; step: string } }
  | { type: 'SET_AUDIO_ANALYSIS'; payload: AudioAnalysis | null }
  | { type: 'SET_VIDEO_ANALYSES'; payload: Record<string, VideoAnalysis> }
  | { type: 'SET_EDIT_DECISIONS'; payload: EditDecision[] }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PLAYBACK_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_SETTINGS'; payload: ProjectSettings }
  | { type: 'SHOW_EXPORT_MODAL'; payload: boolean };

// Create context
interface ProjectContextType {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Initial state
const initialState: ProjectState = {
  // Use enum value directly instead of accessing via WorkflowStep.WELCOME
  currentStep: 'welcome' as WorkflowStep,
  musicFile: null,
  videoFiles: [],
  isAnalyzing: false,
  analysisProgress: { progress: 0, step: '' },
  audioAnalysis: null,
  videoAnalyses: {},
  editDecisions: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  settings: {
    projectName: 'New Music Video Project', // Add required projectName
    genre: 'Hip-Hop/Rap',
    style: 'Dynamic',
    transitions: 'Auto (Based on Music)',
    // Use proper export format settings with all required properties
    exportFormat: {
      resolution: '1080p' as VideoResolution,
      videoCodec: 'h264' as VideoCodec,
      audioCodec: 'aac' as AudioCodec,
      videoBitrate: 8,
      audioBitrate: 192,
      frameRate: 30,
      quality: 80,
      useCRF: true,
      crfValue: 23,
      useHardwareAcceleration: false,
      fileFormat: 'mp4',
      includeChapters: true,
      embedMetadata: true,
      optimizeForWeb: true
    }
  },
  showExportModal: false,
};

// Reducer
function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_MUSIC_FILE':
      return { ...state, musicFile: action.payload };
    case 'SET_VIDEO_FILES':
      return { ...state, videoFiles: action.payload };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_ANALYSIS_PROGRESS':
      return { ...state, analysisProgress: action.payload };
    case 'SET_AUDIO_ANALYSIS':
      return { ...state, audioAnalysis: action.payload };
    case 'SET_VIDEO_ANALYSES':
      return { ...state, videoAnalyses: action.payload };
    case 'SET_EDIT_DECISIONS':
      return { ...state, editDecisions: action.payload };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_PLAYBACK_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SHOW_EXPORT_MODAL':
      return { ...state, showExportModal: action.payload };
    default:
      return state;
  }
}

// Provider component
interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  );
};

// Hook for using the context
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
