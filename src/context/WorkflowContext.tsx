
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
  ProjectSettings
} from '../types/workflow';
import WorkflowStep from '../types/workflow/WorkflowStep';
import { WorkflowStep as AppWorkflowStep, ModalType, ApplicationStep } from '../types/ApplicationState';

// Import services
import { audioService as AudioService } from '../services/AudioService';
import { VideoService } from '../services/VideoService';
import { AudioProcessingProgressCallback } from '../types/media-processing.d';

// Define interface for music file - used internally in this file
interface MusicFile {
  file: File;
  name: string;
  size: number;
  type: string;
  duration: number;
  url: string;
  waveform: number[];
}

// Define interface for processed video file - used internally in this file
interface ProcessedVideoFile {
  file: File;
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  type: string;
  url: string;
  thumbnail: string;
}

// Interface for VideoFile returned from VideoService
interface VideoFileResponse {
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  type: string;
  blobUrl: string;
  thumbnail: string;
}

// Default state for the application
const defaultState: AppState = {
  workflow: {
    currentStep: AppWorkflowStep.INPUT,
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
    rawVideoFiles: [], // Added for storing raw video files
    currentStep: '',
    isAnalyzing: false,
    audioAnalysis: null,
    videoAnalyses: {},
    editDecisions: [],
    showExportModal: false,
    duration: 0
  },
  analysis: {
    audio: null,
    video: null,
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    audioAnalysis: null,
    videoAnalyses: []
  },
  edit: {
    decisions: [],
    currentEdit: null,
    selectedEditIndex: null,
    editDecisionList: null,
    isEditing: false,
    currentTime: 0,
    isPlaying: false,
    zoomLevel: 1
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
    exportError: null,
    isExporting: false,
    progress: 0,
    format: 'premiere'
  },
  ui: {
    errors: {
      audioUpload: null,
      videoUpload: null,
      audioLoad: null,
      analysis: null,
      navigation: null
    },
    audioProgress: null,
    videoProgress: null,
    rawVideoProgress: null,
    modals: {
      showSettings: false,
      showHelp: false
    },
    currentStep: ApplicationStep.WELCOME,
    darkMode: false,
    activeModal: ModalType.NONE,
    sidebarOpen: false,
    fullscreen: false,
    isLoading: false
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
    case WorkflowStep.EDITING:
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
    case WorkflowStep.EDITING:
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
    case WorkflowStep.EDITING:
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
  currentStep: WorkflowStep; // Added missing property
  data: AppState; // Added missing property
  navigation: {
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    goToStep: (step: WorkflowStep) => void;
  };
  actions: {
    updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
    setMusicFile: (file: File | null) => Promise<void>;
    addVideoFile: (file: File) => Promise<void>;
    removeVideoFile: (index: number) => void;
    addRawVideoFile: (file: File) => Promise<void>;
    removeRawVideoFile: (index: number) => void;
    startAnalysis: () => Promise<void>;
    setData: (updater: (prevState: AppState) => AppState) => void;
  };
}

const WorkflowContext = createContext<WorkflowContextType>({
  state: defaultState,
  currentStep: WorkflowStep.INPUT, // Added missing property
  data: defaultState, // Added missing property
  navigation: {
    goToNextStep: () => {},
    goToPreviousStep: () => {},
    goToStep: () => {}
  },
  actions: {
    updateProjectSettings: () => {},
    setMusicFile: async () => {},
    addVideoFile: async () => {},
    removeVideoFile: () => {},
    addRawVideoFile: async () => {},
    removeRawVideoFile: () => {},
    startAnalysis: async () => {},
    setData: () => {}
  }
});

// Provider component
interface WorkflowProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
  audioService?: typeof AudioService;
  videoService?: VideoService;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ 
  children, 
  initialState,
  audioService = AudioService,
  videoService = VideoService.getInstance()
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
          currentStep: currentRouteStep as AppWorkflowStep
        }
      }));
    }
  }, [location.pathname]);
  
  // Navigation methods
  const goToNextStep = () => {
    const nextRoute = getNextRoute(state.workflow.currentStep as WorkflowStep);
    
    // Check if we can access the next route
    const hasAnalysisResults = Boolean(state.analysis.audio && state.analysis.video);
    const hasEditDecisions = state.edit.decisions.length > 0;
    
    if (canAccessRoute(nextRoute, state.workflow.currentStep as WorkflowStep, hasAnalysisResults, hasEditDecisions)) {
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
    const prevRoute = getPreviousRoute(state.workflow.currentStep as WorkflowStep);
    if (prevRoute) {
      navigate(`/${prevRoute}`);
    }
  };
  
  const goToStep = (step: WorkflowStep) => {
    const hasAnalysisResults = Boolean(state.analysis.audio && state.analysis.video);
    const hasEditDecisions = state.edit.decisions.length > 0;
    
    if (canAccessRoute(step, state.workflow.currentStep as WorkflowStep, hasAnalysisResults, hasEditDecisions)) {
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
      // Create a progress callback
      const progressCallback: AudioProcessingProgressCallback = (progress: number, step?: string) => {
        setState(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            audioProgress: {
              percentage: progress,
              currentStep: step || 'Processing...'
            }
          }
        }));
      };
      
      // Load the audio file
      const audioBuffer = await audioService.loadAudio(file, progressCallback);
      
      // Extract waveform data for visualization
      const waveform = await audioService.extractWaveform(audioBuffer);
      
      setState(prev => ({
        ...prev,
        project: {
          ...prev.project,
          musicFile: {
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            duration: audioBuffer.duration,
            url: URL.createObjectURL(file),
            waveform: waveform.data
          }
        },
        workflow: {
          ...prev.workflow,
          totalDuration: audioBuffer.duration
        },
        ui: {
          ...prev.ui,
          audioProgress: null,
          errors: {
            ...prev.ui.errors,
            audioLoad: null
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          audioProgress: null,
          errors: {
            ...prev.ui.errors,
            audioLoad: error instanceof Error ? error.message : 'Failed to load audio file'
          }
        }
      }));
    }
  };
  
  const addVideoFile = async (file: File) => {
    try {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          videoProgress: {
            percentage: 0,
            currentStep: 'Processing video file...'
          }
        }
      }));
      
      // Use VideoService to load and process the video file
      const videoFile = await videoService.loadVideoFile(file);
      
      setState(prev => ({
        ...prev,
        project: {
          ...prev.project,
          videoFiles: [...prev.project.videoFiles, {
            file,
            metadata: {
              id: `video-${Date.now()}`,
              createdAt: new Date(),
              modifiedAt: new Date(),
              size: videoFile.size
            },
            mimeInfo: {
              mimeType: videoFile.type,
              category: 'video',
              isSupported: true,
              extensions: [videoFile.name.split('.').pop() || 'mp4']
            },
            filenameInfo: {
              fullName: videoFile.name,
              baseName: videoFile.name.substring(0, videoFile.name.lastIndexOf('.')),
              extension: videoFile.name.split('.').pop() || 'mp4',
              isValidName: true
            },
            duration: {
              seconds: videoFile.duration,
              formatted: '00:00:00.000'
            },
            resolution: {
              width: videoFile.width,
              height: videoFile.height,
              aspectRatio: videoFile.width / videoFile.height
            },
            sourceType: 'local_upload',
            processing: {
              status: 'completed',
              progress: 100
            },
            url: videoFile.blobUrl,
            videoMetadata: {
              frameRate: videoFile.fps,
              hasAudio: true,
              hasSubtitles: false
            },
            thumbnail: videoFile.thumbnail
          }]
        },
        ui: {
          ...prev.ui,
          videoProgress: null,
          errors: {
            ...prev.ui.errors,
            videoUpload: null
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          videoProgress: null,
          errors: {
            ...prev.ui.errors,
            videoUpload: error instanceof Error ? error.message : 'Failed to process video file'
          }
        }
      }));
    }
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

  // Method for adding raw video files
  const addRawVideoFile = async (file: File) => {
    try {
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
        ui: {
          ...prev.ui,
          videoProgress: {
            percentage: 0,
            currentStep: 'Processing raw video file...'
          }
        }
      }));
      
      // Use VideoService to load and process the video file
      const videoFile = await videoService.loadVideoFile(file);
      
      setState(prev => ({
        ...prev,
        project: {
          ...prev.project,
          rawVideoFiles: [...prev.project.rawVideoFiles, {
            file,
            name: videoFile.name,
            size: videoFile.size,
            duration: videoFile.duration,
            width: videoFile.width,
            height: videoFile.height,
            fps: videoFile.fps,
            type: videoFile.type,
            url: videoFile.blobUrl,
            thumbnail: videoFile.thumbnail
          }]
        },
        ui: {
          ...prev.ui,
          videoProgress: null,
          errors: {
            ...prev.ui.errors,
            videoUpload: null
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          videoProgress: null,
          errors: {
            ...prev.ui.errors,
            videoUpload: error instanceof Error ? error.message : 'Failed to process raw video file'
          }
        }
      }));
    }
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

    // Check if we have video files
    if (state.project.videoFiles.length === 0 && state.project.rawVideoFiles.length === 0) {
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          errors: {
            ...prev.ui.errors,
            analysis: 'No video files selected'
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
      // Create a progress callback for audio analysis
      const audioProgressCallback: AudioProcessingProgressCallback = (progress: number, step?: string) => {
        setState(prev => ({
          ...prev,
          workflow: {
            ...prev.workflow,
            analysisProgress: {
              percentage: Math.floor(progress * 0.5), // Audio is 50% of total progress
              currentStep: `Audio analysis: ${step || 'Processing...'}`,
              isComplete: false
            }
          }
        }));
      };
      
      // Perform audio analysis
      const audioAnalysis = await audioService.analyzeAudio(
        state.project.musicFile.file,
        undefined,
        audioProgressCallback
      );
      
      // Update progress
      setState(prev => ({
        ...prev,
        workflow: {
          ...prev.workflow,
          analysisProgress: {
            percentage: 50,
            currentStep: 'Audio analysis complete. Starting video analysis...',
            isComplete: false
          }
        }
      }));
      
      // Analyze video files
      const videoAnalysisResults: any[] = [];
      
      // Process regular video files
      for (let i = 0; i < state.project.videoFiles.length; i++) {
        const videoFile = state.project.videoFiles[i];
        
        // Update progress
        setState(prev => ({
          ...prev,
          workflow: {
            ...prev.workflow,
            analysisProgress: {
              percentage: 50 + Math.floor((i / (state.project.videoFiles.length + state.project.rawVideoFiles.length)) * 50),
              currentStep: `Analyzing video ${i + 1} of ${state.project.videoFiles.length + state.project.rawVideoFiles.length}...`,
              isComplete: false
            }
          }
        }));
        
        // Analyze the video
        const videoAnalysis = await videoService.analyzeVideo(videoFile.file);
        videoAnalysisResults.push(videoAnalysis);
      }
      
      // Process raw video files
      for (let i = 0; i < state.project.rawVideoFiles.length; i++) {
        const videoFile = state.project.rawVideoFiles[i];
        
        // Update progress
        setState(prev => ({
          ...prev,
          workflow: {
            ...prev.workflow,
            analysisProgress: {
              percentage: 50 + Math.floor(((state.project.videoFiles.length + i) / (state.project.videoFiles.length + state.project.rawVideoFiles.length)) * 50),
              currentStep: `Analyzing raw video ${i + 1} of ${state.project.rawVideoFiles.length}...`,
              isComplete: false
            }
          }
        }));
        
        // Analyze the video
        const videoAnalysis = await videoService.analyzeVideo(videoFile.file);
        videoAnalysisResults.push(videoAnalysis);
      }
      
      // Save analysis results
      setState(prev => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          audio: audioAnalysis,
          video: videoAnalysisResults,
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
      console.error('Analysis error:', error);
      
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
  
  // Create a setData method for direct state updates
  const setData = (updater: (prevState: AppState) => AppState) => {
    setState(updater);
  };

  // Create a context value with state and methods
  const contextValue: WorkflowContextType = {
    state,
    currentStep: state.workflow.currentStep as WorkflowStep, // Added type assertion
    data: state, // Added missing property
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
      startAnalysis,
      setData
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
