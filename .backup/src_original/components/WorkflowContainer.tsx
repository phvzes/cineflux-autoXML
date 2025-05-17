/**
 * WorkflowContainer.tsx
 * 
 * Container component that wraps the workflow steps and provides the layout structure.
 * This component serves as the parent for all workflow step routes.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { WorkflowStepper } from './WorkflowStepper';
import { ExportModal } from './export/ExportModal';
import { AccessibleDialog } from './AccessibleDialog';
import { useProject } from '../context/ProjectContext';
import { useWorkflow } from '../context/WorkflowContext';
import { colorPalette } from '../theme';
import { ApplicationStep } from '../types/UITypes';
import { WorkflowStep } from '../types/workflow';
import useKeyboardNavigation from '../hooks/useKeyboardNavigation';
import ErrorBoundary from './ErrorBoundary';

// Define the AppState interface to match what's expected
interface AppState {
  currentStep: string;
  isProcessing: boolean;
  progressPercentage: number;
  statusMessage: string;
}

const WorkflowContainer: React.FC = () => {
  const { state: projectState, dispatch } = useProject();
  const { state, navigation } = useWorkflow();
  
  // Extract workflow state from the context state
  const workflowState: AppState = {
    currentStep: state.workflow.currentStep,
    isProcessing: state.analysis.isAnalyzing,
    progressPercentage: state.workflow.analysisProgress.percentage,
    statusMessage: state.workflow.analysisProgress.currentStep
  };
  const [showHelpDialog, setShowHelpDialog] = React.useState(false);
  
  // Define keyboard shortcuts
  const { shortcuts } = useKeyboardNavigation([
    {
      key: 'ArrowRight',
      altKey: true,
      handler: () => {
        if (!state.analysis.isAnalyzing) {
          const currentStepIndex = Object.values(WorkflowStep).indexOf(state.workflow.currentStep as WorkflowStep);
          if (currentStepIndex < Object.values(WorkflowStep).length - 1) {
            navigation.goToStep(Object.values(WorkflowStep)[currentStepIndex + 1]);
          }
        }
      },
      description: 'Go to next step'
    },
    {
      key: 'ArrowLeft',
      altKey: true,
      handler: () => {
        if (!state.analysis.isAnalyzing) {
          const currentStepIndex = Object.values(WorkflowStep).indexOf(state.workflow.currentStep as WorkflowStep);
          if (currentStepIndex > 0) {
            navigation.goToStep(Object.values(WorkflowStep)[currentStepIndex - 1]);
          }
        }
      },
      description: 'Go to previous step'
    },
    {
      key: 'e',
      altKey: true,
      handler: () => {
        if (!state.analysis.isAnalyzing && projectState.editDecisions.length > 0) {
          dispatch({ type: 'SHOW_EXPORT_MODAL', payload: true });
        }
      },
      description: 'Open export dialog'
    },
    {
      key: 'h',
      altKey: true,
      handler: () => {
        setShowHelpDialog(true);
      },
      description: 'Show help'
    },
    {
      key: 'Escape',
      handler: () => {
        if (showHelpDialog) {
          setShowHelpDialog(false);
        }
        if (projectState.showExportModal) {
          dispatch({ type: 'SHOW_EXPORT_MODAL', payload: false });
        }
      },
      description: 'Close dialog'
    }
  ]);
  
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
    dispatch({ type: 'SHOW_EXPORT_MODAL', payload: true });
  };

  // Add workflow stepper to the layout
  const renderWorkflowStepper = () => {
    // Don't render the workflow stepper on the welcome page
    if (projectState.currentStep === 'welcome') {
      return null;
    }
    
    return (
      <div className="mb-8">
        <WorkflowStepper
          currentStep={workflowState.currentStep}
          isProcessing={workflowState.isProcessing}
          progressPercentage={workflowState.progressPercentage}
          statusMessage={workflowState.statusMessage}
          onStepClick={(step) => navigation.goToStep(step as WorkflowStep)}
        />
      </div>
    );
  };
  
  // Create a map of video files by ID for the export modal
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
        {/* This is where the route components will be rendered */}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        
        {/* Export Modal with accessibility improvements */}
        {projectState.showExportModal && (
          <ExportModal
            isOpen={projectState.showExportModal}
            onClose={() => dispatch({ type: 'SHOW_EXPORT_MODAL', payload: false })}
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
              <div className="grid grid-cols-2 gap-2" role="list">
                {shortcuts.map((shortcut, index) => (
                  <React.Fragment key={index}>
                    <div style={{ color: colorPalette.lightGrey }} role="listitem">{shortcut.description}</div>
                    <div style={{ color: colorPalette.offWhite }} role="listitem">{shortcut.key}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-2" style={{ color: colorPalette.offWhite }}>
              Getting Started
            </h3>
            <p className="mb-4" style={{ color: colorPalette.lightGrey }}>
              CineFlux-AutoXML helps you generate XML files for video editing software. Follow the step-by-step process to upload your media, analyze it, configure settings, and export the final XML.
            </p>
            
            <h3 className="text-lg font-medium mb-2" style={{ color: colorPalette.offWhite }}>
              Accessibility Features
            </h3>
            <ul className="mb-4 list-disc pl-5" style={{ color: colorPalette.lightGrey }}>
              <li>Keyboard navigation throughout the application</li>
              <li>Screen reader support with ARIA attributes</li>
              <li>Focus management in dialogs and interactive elements</li>
              <li>High contrast text and UI elements</li>
              <li>Descriptive labels and instructions</li>
            </ul>
            
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
};

export default WorkflowContainer;
