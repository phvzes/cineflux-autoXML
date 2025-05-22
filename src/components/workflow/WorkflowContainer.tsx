/**
 * WorkflowContainer.tsx
 * 
 * This component manages the workflow state and transitions between steps.
 * It serves as the parent container for all workflow steps and handles
 * the logic for moving between steps.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { WorkflowProvider, useWorkflow } from '@/context/WorkflowContext';
import { AppState } from '@/types/consolidated';
import AudioService from '@/services/AudioService';

// Import components
import WorkflowStepper from './WorkflowStepper';
import StatusBar from '../status/StatusBar';

interface WorkflowContainerProps {
  initialState?: Partial<AppState>;
  audioService: AudioService;
}

const WorkflowContainerInner: React.FC = () => {
  const { state } = useWorkflow();
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top navigation */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <WorkflowStepper 
          currentStep={state.workflow.currentStep}
          hasAnalysisResults={Boolean(state.analysis.audio)}
          hasEditDecisions={state.edit.decisions.length > 0}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-grow overflow-auto">
        {/* The Outlet component from React Router will render the current route */}
        <Outlet />
      </div>
      
      {/* Status bar */}
      <StatusBar 
        currentStep={state.workflow.currentStep}
        isAnalyzing={state.analysis.isAnalyzing}
        progress={state.workflow.analysisProgress.percentage}
        statusMessage={state.workflow.analysisProgress.currentStep}
      />
    </div>
  );
};

const WorkflowContainer: React.FC<WorkflowContainerProps> = ({ 
  initialState,
  audioService
}) => {
  return (
    <WorkflowProvider initialState={initialState} audioService={audioService}>
      <WorkflowContainerInner />
    </WorkflowProvider>
  );
};

export default WorkflowContainer;
