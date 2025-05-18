import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AudioAnalysis } from '../types/AudioAnalysis';
import { VideoAnalysisResult } from '../types/VideoAnalysis';
import { EditDecisionResult } from '../engine';

// Define the state interface
interface AnalysisState {
  // Processing status
  isProcessing: boolean;
  processingStep: string;
  progress: number;
  error: string | null;
  
  // Analysis results
  audioAnalysis: AudioAnalysis | null;
  videoAnalyses: Record<string, VideoAnalysisResult>;
  editDecisionResult: EditDecisionResult | null;
}

// Define action types
type AnalysisAction =
  | { type: 'START_PROCESSING'; payload: { step: string } }
  | { type: 'UPDATE_PROGRESS'; payload: { progress: number; step: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_AUDIO_ANALYSIS'; payload: AudioAnalysis }
  | { type: 'SET_VIDEO_ANALYSIS'; payload: { id: string; analysis: VideoAnalysisResult } }
  | { type: 'SET_EDIT_DECISION_RESULT'; payload: EditDecisionResult }
  | { type: 'FINISH_PROCESSING' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AnalysisState = {
  isProcessing: false,
  processingStep: '',
  progress: 0,
  error: null,
  audioAnalysis: null,
  videoAnalyses: {},
  editDecisionResult: null
};

// Create the context
interface AnalysisContextType {
  state: AnalysisState;
  dispatch: React.Dispatch<AnalysisAction>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

// Reducer function
function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        processingStep: action.payload.step,
        progress: 0,
        error: null
      };
    
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.payload.progress,
        processingStep: action.payload.step
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        isProcessing: false,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'SET_AUDIO_ANALYSIS':
      return {
        ...state,
        audioAnalysis: action.payload
      };
    
    case 'SET_VIDEO_ANALYSIS':
      return {
        ...state,
        videoAnalyses: {
          ...state.videoAnalyses,
          [action.payload.id]: action.payload.analysis
        }
      };
    
    case 'SET_EDIT_DECISION_RESULT':
      return {
        ...state,
        editDecisionResult: action.payload
      };
    
    case 'FINISH_PROCESSING':
      return {
        ...state,
        isProcessing: false
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Provider component
interface AnalysisProviderProps {
  children: ReactNode;
}

export const AnalysisProvider: React.FC<AnalysisProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(analysisReducer, initialState);
  
  return (
    <AnalysisContext.Provider value={{ state, dispatch }}>
      {children}
    </AnalysisContext.Provider>
  );
};

// Hook for using the context
export const useAnalysis = (): AnalysisContextType => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
