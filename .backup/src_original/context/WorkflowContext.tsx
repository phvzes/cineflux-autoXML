/**
 * WorkflowContext.tsx
 * 
 * This file provides the context for managing workflow state across the application.
 * It includes the context definition, provider component, and custom hooks.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppState, 
  WorkflowStep,
  ProjectSettings,
  VideoFile
} from '../types/workflow';

// Import services
// We'll need to create or import the AudioService
import { AudioService } from '../services/AudioService';

// Default state for the application
const defaultState: AppState = {
  workflow: {
    currentStep: WorkflowStep.INPUT,
    analysisProgress: {
      percentage: 0,
      currentStep: '',
      isComplete: false
    },
    isPlaying: false,
    currentTime: 0,
    totalDuration: 0
  },
  project: {
    settings: {
      genre: 'Hip-Hop/Rap',
      style: 'Dynamic',
      transitions: 'Auto (Based on Music)',
      exportFormat: 'Premiere Pro XML'
    },
    musicFile: null,
    videoFiles: [],
    rawVideoFiles: [] // Added for storing raw video files
  },
  analysis: {
    audio: null,
    video: null,
    isAnalyzing: false
  },
  edit: {
    decisions: [],
    currentEdit: null,
    selectedEditIndex: null
  },
  export: {
    settings: {
      format: 'premiere',
      includeAudio: true,
      includeMarkers: true,
      generateNotes: true,
      outputPath: '/User/username/Documents/Projects/My Music Video'
    },
    showExportModal: false,
    exportProgress: 0,
    exportComplete: false,
    exportError: null
  },
  ui: {
    errors: {},
    modals: {
      showSettings: false,
      showHelp: false
    }
  }
};

// Helper functions for route navigation
const canAccessRoute = (
  targetStep: WorkflowStep, 
  currentStep: WorkflowStep, 
  hasAnalysisResults: boolean, 
  hasEditDecisions: boolean
): boolean => {
  // Logic to determine if a step can be accessed
  switch (targetStep) {
    case WorkflowStep.INPUT:
      return true; // Always accessible
    case WorkflowStep.ANALYSIS:
      return true; // Accessible if we have a music file (would be checked in component)
    case WorkflowStep.EDIT:
      return hasAnalysisResults; // Need analysis results
    case WorkflowStep.EXPORT:
      return hasAnalysisResults && hasEditDecisions; // Need both analysis and edit decisions
    default:
      return false;
  }
};

const getNextRoute = (currentStep: WorkflowStep): WorkflowStep => {
  switch (currentStep) {
    case WorkflowStep.INPUT:
      return WorkflowStep.ANALYSIS;
    case WorkflowStep.ANALYSIS:
      return WorkflowStep.EDIT;
    case WorkflowStep.EDIT:
      return WorkflowStep.EXPORT;
    case WorkflowStep.EXPORT:
    default:
      return WorkflowStep.EXPORT; // No next step after export
  }
};

const getPreviousRoute = (currentStep: WorkflowStep): WorkflowStep | null => {
  switch (currentStep) {
    case WorkflowStep.INPUT:
      return null; // No previous step
    case WorkflowStep.ANALYSIS:
      return WorkflowStep.INPUT;
    case WorkflowStep.EDIT:
      return WorkflowStep.ANALYSIS;
    case WorkflowStep.EXPORT:
      return WorkflowStep.EDIT;
    default:
      return null;
  }
};

// Create the context with a default value
interface WorkflowContextType {
  state: AppState;
  navigation: {
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    goToStep: (step: WorkflowStep) => void;
  };
  actions: {
    updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
    setMusicFile: (file: File | null) => Promise<void>;
    addVideoFile: (file: File) => void;
    removeVideoFile: (index: number) => void;
    addRawVideoFile: (file: File) => void; // New method for raw video files
    removeRawVideoFile: (index: number) => void; // New method for raw video files
    startAnalysis: () => Promise<void>;
  };
}

const WorkflowContext = createContext<WorkflowContextType>({
  state: defaultState,
  navigation: {
    goToNextStep: () => {},
    goToPreviousStep: () => {},
    goToStep: () => {}
  },
  actions: {
    updateProjectSettings: () => {},
    setMusicFile: async () => {},
    addVideoFile: () => {},
    removeVideoFile: () => {},
    addRawVideoFile: () => {}, // New method for raw video files
    removeRawVideoFile: () => {}, // New method for raw video files
    startAnalysis: async () => {}
  }
});

// Provider component
interface WorkflowProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
  audioService: AudioService;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ 
  children, 
  initialState,
  audioService
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract current step from location
  const getCurrentStep = (): WorkflowStep => {
    const path = location.pathname.split('/')[1] || 'input';
    return path as WorkflowStep;
  };
  
  // State with default values
  const [state, setState] = useState<AppState>({
    ...defaultState,
    workflow: {
      ...defaultState.workflow,
      currentStep: getCurrentStep()
    },
    ...(initialState || {})
  });
  
  // Sync current step with URL
  useEffect(() => {
    const currentRouteStep = getCurrentStep();
    
    if (state.workflow.currentStep !== currentRouteStep) {
      setState(prev => ({
        ...prev,
        workflow: {
          ...prev.workflow,
          currentStep: currentRouteStep
        }
      }));
    }
  }, [location.pathname]);
  
  // Navigation methods
  const goToNextStep = () => {
    const nextRoute = getNextRoute(state.workflow.currentStep);
    
    // Check if we can access the next route
    const hasAnalysisResults = Boolean(state.analysis.audio && state.analysis.video);
    const hasEditDecisions = state.edit.decisions.length > 0;
    
    if (canAccessRoute(nextRoute, state.workflow.currentStep, hasAnalysisResults, hasEditDecisions)) {
      navigate(`/${nextRoute}`);
    } else {
      // Handle case where next step is not accessible
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          errors: {
            ...prev.ui.errors,
            navigation: `Cannot proceed to ${nextRoute} without completing current step`
          }
        }
      }));
    }
  };
  
  const goToPreviousStep = () => {
    const prevRoute = getPreviousRoute(state.workflow.currentStep);
    if (prevRoute) {
      navigate(`/${prevRoute}`);
    }
  };
  
  const goToStep = (step: WorkflowStep) => {
    const hasAnalysisResults = Boolean(state.analysis.audio && state.analysis.video);
    const hasEditDecisions = state.edit.decisions.length > 0;
    
    if (canAccessRoute(step, state.workflow.currentStep, hasAnalysisResults, hasEditDecisions)) {
      navigate(`/${step}`);
    } else {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          errors: {
            ...prev.ui.errors,
            navigation: `Cannot access ${step} without completing required steps`
          }
        }
      }));
    }
  };
  
  // State update methods
  const updateProjectSettings = (settings: Partial<ProjectSettings>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        settings: {
          ...prev.project.settings,
          ...settings
        }
      }
    }));
  };
  
  const setMusicFile = async (file: File | null) => {
    if (!file) {
      setState(prev => ({
        ...prev,
        project: {
          ...prev.project,
          musicFile: null
        }
      }));
      return;
    }
    
    try {
      const audioFile = await audioService.loadAudioFile(file);
      
      setState(prev => ({
        ...prev,
        project: {
          ...prev.project,
          musicFile: audioFile
        },
        workflow: {
          ...prev.workflow,
          totalDuration: audioFile.duration
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          errors: {
            ...prev.ui.errors,
            audioLoad: error instanceof Error ? error.message : 'Failed to load audio file'
          }
        }
      }));
    }
  };
  
  const addVideoFile = (file: File) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        videoFiles: [...prev.project.videoFiles, {
          file,
          name: file.name,
          size: file.size,
          duration: 0, // This would be calculated
          type: file.type,
          url: URL.createObjectURL(file)
        }]
      }
    }));
  };
  
  const removeVideoFile = (index: number) => {
    setState(prev => {
      const newFiles = [...prev.project.videoFiles];
      
      // Release the object URL to prevent memory leaks
      if (newFiles[index]?.url) {
        URL.revokeObjectURL(newFiles[index].url);
      }
      
      newFiles.splice(index, 1);
      
      return {
        ...prev,
        project: {
          ...prev.project,
          videoFiles: newFiles
        }
      };
    });
  };

  // New method for adding raw video files
  const addRawVideoFile = (file: File) => {
    // Validate file type
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validVideoTypes.includes(file.type)) {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          errors: {
            ...prev.ui.errors,
            videoUpload: `Invalid video format: ${file.type}. Supported formats: MP4, MOV, AVI, WebM`
          }
        }
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        rawVideoFiles: [...prev.project.rawVideoFiles, {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }]
      },
      ui: {
        ...prev.ui,
        errors: {
          ...prev.ui.errors,
          videoUpload: "" // Use empty string instead of null
        }
      }
    }));
  };

  // New method for removing raw video files
  const removeRawVideoFile = (index: number) => {
    setState(prev => {
      const newFiles = [...prev.project.rawVideoFiles];
      
      // Release the object URL to prevent memory leaks
      if (newFiles[index]?.url) {
        URL.revokeObjectURL(newFiles[index].url);
      }
      
      newFiles.splice(index, 1);
      
      return {
        ...prev,
        project: {
          ...prev.project,
          rawVideoFiles: newFiles
        }
      };
    });
  };
  
  const startAnalysis = async () => {
    if (!state.project.musicFile?.file) {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          errors: {
            ...prev.ui.errors,
            analysis: 'No music file selected'
          }
        }
      }));
      return;
    }

    // Check if we have raw video files
    if (state.project.rawVideoFiles.length === 0) {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          errors: {
            ...prev.ui.errors,
            analysis: 'No raw video files selected'
          }
        }
      }));
      return;
    }
    
    setState(prev => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        isAnalyzing: true
      },
      workflow: {
        ...prev.workflow,
        analysisProgress: {
          percentage: 0,
          currentStep: 'Initializing analysis...',
          isComplete: false
        }
      }
    }));
    
    try {
      // Update progress state (this would normally happen throughout analysis)
      setState(prev => ({
        ...prev,
        workflow: {
          ...prev.workflow,
          analysisProgress: {
            percentage: 20,
            currentStep: 'Beat detection in progress...',
            isComplete: false
          }
        }
      }));
      
      // Perform audio analysis
      const audioAnalysis = await audioService.analyzeAudio(state.project.musicFile.file);
      
      // Update progress
      setState(prev => ({
        ...prev,
        workflow: {
          ...prev.workflow,
          analysisProgress: {
            percentage: 80,
            currentStep: 'Finalizing analysis...',
            isComplete: false
          }
        }
      }));
      
      // Save analysis results
      setState(prev => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          audio: audioAnalysis,
          isAnalyzing: false
        },
        workflow: {
          ...prev.workflow,
          analysisProgress: {
            percentage: 100,
            currentStep: 'Analysis complete',
            isComplete: true
          }
        }
      }));
      
      // Navigate to editing step
      goToNextStep();
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          isAnalyzing: false
        },
        ui: {
          ...prev.ui,
          errors: {
            ...prev.ui.errors,
            analysis: error instanceof Error ? error.message : 'Analysis failed'
          }
        }
      }));
    }
  };
  
  // Create a context value with state and methods
  const contextValue = {
    state,
    navigation: {
      goToNextStep,
      goToPreviousStep,
      goToStep
    },
    actions: {
      updateProjectSettings,
      setMusicFile,
      addVideoFile,
      removeVideoFile,
      addRawVideoFile,
      removeRawVideoFile,
      startAnalysis
    }
  };
  
  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Custom hook for using the workflow context
export const useWorkflow = () => useContext(WorkflowContext);

export default WorkflowContext;
