import { useEffect, useState, useRef } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { InputStep } from './components/steps/InputStep';
import { AnalysisStep } from './components/steps/AnalysisStep';
import { EditingStep } from './components/steps/EditingStep';
import { PreviewStep } from './components/steps/PreviewStep';
import { ExportModal } from './components/export/ExportModal';
import { useProject } from './context/ProjectContext';
import { useWorkflow } from './context/WorkflowContext';
import { WorkflowStepper } from './components/WorkflowStepper';
import { AccessibleDialog } from './components/AccessibleDialog';
import { Loading, ErrorState } from './components/AsyncStates';
import { ApplicationStep } from './types/UITypes';
import { colorPalette } from './theme';
import AudioService from './services/AudioService';
import VideoService from './services/VideoService';
import EditService from './services/EditService';
import PreviewGenerator from './services/PreviewGenerator';

export default function App() {
  const { state: projectState, dispatch } = useProject();
  const { state: workflowState, setStep } = useWorkflow();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Create audio element for playback
  useEffect(() => {
    const audioElement = new Audio();
    audioElementRef.current = audioElement;
    
    // Clean up
    return () => {
      audioElement.pause();
      audioElement.src = '';
    };
  }, []);
  
  // Set audio source when music file changes
  useEffect(() => {
    if (projectState.musicFile && audioElementRef.current) {
      const audioElement = audioElementRef.current;
      const fileUrl = URL.createObjectURL(projectState.musicFile);
      
      audioElement.src = fileUrl;
      audioElement.load();
      
      // Get duration when metadata is loaded
      audioElement.onloadedmetadata = () => {
        dispatch({ type: 'SET_DURATION', payload: audioElement.duration });
      };
      
      // Update current time during playback
      audioElement.ontimeupdate = () => {
        dispatch({ type: 'SET_PLAYBACK_TIME', payload: audioElement.currentTime });
      };
      
      // Reset playing state when ended
      audioElement.onended = () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
      };
      
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    }
  }, [projectState.musicFile, dispatch]);
  
  // Sync audio playback with state
  useEffect(() => {
    if (audioElementRef.current) {
      if (projectState.isPlaying) {
        // Set current time if it's more than 0.5 seconds off
        if (Math.abs(audioElementRef.current.currentTime - projectState.currentTime) > 0.5) {
          audioElementRef.current.currentTime = projectState.currentTime;
        }
        
        audioElementRef.current.play().catch(error => {
          console.error('Playback failed:', error);
          dispatch({ type: 'SET_PLAYING', payload: false });
        });
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [projectState.isPlaying, projectState.currentTime, dispatch]);
  
  // Handle new project
  const handleNewProject = () => {
    if (projectState.isAnalyzing) return;
    
    if (projectState.musicFile || projectState.videoFiles.length > 0) {
      if (window.confirm('Are you sure you want to create a new project? All unsaved work will be lost.')) {
        dispatch({ type: 'SET_STEP', payload: 'input' });
        dispatch({ type: 'SET_MUSIC_FILE', payload: null });
        dispatch({ type: 'SET_VIDEO_FILES', payload: [] });
        dispatch({ type: 'SET_AUDIO_ANALYSIS', payload: null });
        dispatch({ type: 'SET_VIDEO_ANALYSES', payload: {} });
        dispatch({ type: 'SET_EDIT_DECISIONS', payload: [] });
        dispatch({ type: 'SET_PLAYBACK_TIME', payload: 0 });
        
        // Clean up audio element
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.src = '';
        }
        
        // Clear preview cache
        PreviewGenerator.clearCache();
      }
    }
  };
  
  // Handle open project
  const handleOpenProject = () => {
    // In a real app, this would open a file dialog
    alert('Open project functionality would be implemented here');
  };
  
  // Handle save project
  const handleSaveProject = () => {
    // In a real app, this would save the project
    alert('Save project functionality would be implemented here');
  };
  
  // Handle export
  const handleExport = () => {
    setShowExportModal(true);
  };
  
  // Render the appropriate step
  const renderStep = () => {
    switch (projectState.currentStep) {
      case 'input':
        return <InputStep />;
      case 'analyzing':
        return <AnalysisStep />;
      case 'editing':
        return <EditingStep audioElement={audioElementRef.current} />;
      case 'preview':
        return <PreviewStep audioElement={audioElementRef.current} />;
      default:
        return <InputStep />;
    }
  };
  
  // Create a map of video files by ID
  const videoFilesById: Record<string, File> = {};
  projectState.videoFiles.forEach(file => {
    const analyses = projectState.videoAnalyses;
    // Find the analysis for this file
    for (const id in analyses) {
      if (analyses[id].clip.name === file.name) {
        videoFilesById[id] = file;
        break;
      }
    }
  });

  // Add workflow stepper to the layout
  const renderWorkflowStepper = () => {
    return (
      <div className="mb-8">
        <WorkflowStepper
          currentStep={workflowState.currentStep}
          isProcessing={workflowState.isProcessing}
          progressPercentage={workflowState.progressPercentage}
          statusMessage={workflowState.statusMessage}
          onStepClick={setStep}
        />
      </div>
    );
  };
  
  return (
    <>
      <AppLayout
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onExport={handleExport}
        onHelpClick={() => setShowHelpDialog(true)}
        renderWorkflowStepper={renderWorkflowStepper}
      >
        {renderStep()}
        
        {/* Export Modal with accessibility improvements */}
        {showExportModal && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            editDecisions={projectState.editDecisions}
            videoFiles={videoFilesById}
            audioFile={projectState.musicFile}
            settings={projectState.settings}
            duration={projectState.duration}
          />
        )}
      </AppLayout>

      {/* Help Dialog */}
      {showHelpDialog && (
        <AccessibleDialog
          isOpen={showHelpDialog}
          onClose={() => setShowHelpDialog(false)}
          title="Help & Keyboard Shortcuts"
          description="Learn how to use CineFlux-AutoXML efficiently"
        >
          <div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colorPalette.offWhite }}>
              Keyboard Shortcuts
            </h3>
            <div
              className="p-4 rounded-md mb-4"
              style={{ backgroundColor: colorPalette.darkGrey }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div style={{ color: colorPalette.lightGrey }}>Next Step</div>
                <div style={{ color: colorPalette.offWhite }}>Alt + Right Arrow</div>
                <div style={{ color: colorPalette.lightGrey }}>Previous Step</div>
                <div style={{ color: colorPalette.offWhite }}>Alt + Left Arrow</div>
                <div style={{ color: colorPalette.lightGrey }}>Open Settings</div>
                <div style={{ color: colorPalette.offWhite }}>Alt + S</div>
                <div style={{ color: colorPalette.lightGrey }}>Help</div>
                <div style={{ color: colorPalette.offWhite }}>Alt + H</div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-2" style={{ color: colorPalette.offWhite }}>
              Getting Started
            </h3>
            <p className="mb-4" style={{ color: colorPalette.lightGrey }}>
              CineFlux-AutoXML helps you generate XML files for video editing software. Follow the step-by-step process to upload your media, analyze it, configure settings, and export the final XML.
            </p>
            
            <button
              className="w-full px-4 py-2 rounded-md"
              style={{
                backgroundColor: colorPalette.subtleOrange,
                color: colorPalette.offWhite,
              }}
              onClick={() => setShowHelpDialog(false)}
            >
              Close
            </button>
          </div>
        </AccessibleDialog>
      )}
    </>
  );
}
