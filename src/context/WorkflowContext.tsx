import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ApplicationStep, WorkflowState } from '../types/UITypes';

// Initial workflow state
const initialWorkflowState: WorkflowState = {
  currentStep: ApplicationStep.WELCOME,
  isProcessing: false,
  progressPercentage: 0,
  stepHistory: [],
};

// Action types
type WorkflowAction =
  | { type: 'SET_STEP'; payload: ApplicationStep }
  | { type: 'START_PROCESSING'; payload?: { statusMessage?: string } }
  | { type: 'UPDATE_PROGRESS'; payload: { progressPercentage: number; statusMessage?: string } }
  | { type: 'COMPLETE_PROCESSING' }
  | { type: 'GO_BACK' }
  | { type: 'SET_SUB_STEP'; payload: { subStep: string } };

// Reducer function
const workflowReducer = (state: WorkflowState, action: WorkflowAction): WorkflowState => {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
        stepHistory: [...state.stepHistory, state.currentStep],
        isProcessing: false,
        progressPercentage: 0,
        statusMessage: undefined,
      };
    
    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        progressPercentage: 0,
        statusMessage: action.payload?.statusMessage,
      };
    
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progressPercentage: action.payload.progressPercentage,
        statusMessage: action.payload.statusMessage || state.statusMessage,
      };
    
    case 'COMPLETE_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        progressPercentage: 100,
      };
    
    case 'GO_BACK':
      const previousStep = state.stepHistory.length > 0
        ? state.stepHistory[state.stepHistory.length - 1]
        : state.currentStep;
      
      return {
        ...state,
        currentStep: previousStep,
        stepHistory: state.stepHistory.slice(0, -1),
        isProcessing: false,
        progressPercentage: 0,
        statusMessage: undefined,
      };
    
    case 'SET_SUB_STEP':
      return {
        ...state,
        subStep: action.payload.subStep,
      };
    
    default:
      return state;
  }
};

// Context type
interface WorkflowContextType {
  state: WorkflowState;
  setStep: (step: ApplicationStep) => void;
  startProcessing: (statusMessage?: string) => void;
  updateProgress: (progressPercentage: number, statusMessage?: string) => void;
  completeProcessing: () => void;
  goBack: () => void;
  setSubStep: (subStep: string) => void;
  canNavigateTo: (step: ApplicationStep) => boolean;
}

// Create context
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Provider component
export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialWorkflowState);

  // Helper function to determine if a step is accessible
  const canNavigateTo = (step: ApplicationStep): boolean => {
    // Define the workflow order (excluding settings which is accessible from anywhere)
    const workflowOrder = [
      ApplicationStep.WELCOME,
      ApplicationStep.FILE_UPLOAD,
      ApplicationStep.MEDIA_ANALYSIS,
      ApplicationStep.EDIT_CONFIGURATION,
      ApplicationStep.PREVIEW,
      ApplicationStep.EXPORT,
    ];

    // Settings is always accessible
    if (step === ApplicationStep.SETTINGS) {
      return true;
    }

    // Get current step index
    const currentIndex = workflowOrder.indexOf(state.currentStep);
    const targetIndex = workflowOrder.indexOf(step);

    // Can't navigate if processing
    if (state.isProcessing) {
      return false;
    }

    // Can navigate to current step or any previous step
    // Can also navigate to the next step in sequence
    return targetIndex <= currentIndex || targetIndex === currentIndex + 1;
  };

  // Action creators
  const setStep = (step: ApplicationStep) => {
    if (canNavigateTo(step)) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  };

  const startProcessing = (statusMessage?: string) => {
    dispatch({ type: 'START_PROCESSING', payload: { statusMessage } });
  };

  const updateProgress = (progressPercentage: number, statusMessage?: string) => {
    dispatch({
      type: 'UPDATE_PROGRESS',
      payload: { progressPercentage, statusMessage },
    });
  };

  const completeProcessing = () => {
    dispatch({ type: 'COMPLETE_PROCESSING' });
  };

  const goBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  const setSubStep = (subStep: string) => {
    dispatch({ type: 'SET_SUB_STEP', payload: { subStep } });
  };

  const value = {
    state,
    setStep,
    startProcessing,
    updateProgress,
    completeProcessing,
    goBack,
    setSubStep,
    canNavigateTo,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Custom hook for using the workflow context
export const useWorkflow = (): WorkflowContextType => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export default WorkflowContext;
