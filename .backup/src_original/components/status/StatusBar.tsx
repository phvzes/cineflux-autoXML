/**
 * StatusBar.tsx
 * 
 * This component displays the current status of the workflow,
 * including progress indicators and status messages.
 */

import React from 'react';
import { WorkflowStep } from '../../types/workflow';

interface StatusBarProps {
  currentStep: WorkflowStep;
  isAnalyzing: boolean;
  progress: number;
  statusMessage: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentStep,
  isAnalyzing,
  progress,
  statusMessage
}) => {
  // Get step-specific status message
  const getStepStatus = (): string => {
    if (statusMessage) return statusMessage;
    
    switch (currentStep) {
      case WorkflowStep.INPUT:
        return 'Select audio and video files to begin';
      case WorkflowStep.ANALYSIS:
        return isAnalyzing 
          ? `Analyzing audio: ${progress}% complete` 
          : 'Ready to analyze audio';
      case WorkflowStep.EDIT:
        return 'Edit your video based on audio analysis';
      case WorkflowStep.EXPORT:
        return 'Configure export settings and generate your video';
      default:
        return '';
    }
  };
  
  // Determine if we should show the progress bar
  const showProgressBar = isAnalyzing || progress > 0;
  
  return (
    <div className="status-bar bg-gray-800 border-t border-gray-700 p-2">
      <div className="container mx-auto flex items-center">
        {/* Status indicator dot */}
        <div className={`w-3 h-3 rounded-full mr-3 ${isAnalyzing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
        
        {/* Status message */}
        <div className="flex-grow">
          <span className="text-sm text-gray-300">{getStepStatus()}</span>
          
          {/* Progress bar (only shown during analysis or when progress > 0) */}
          {showProgressBar && (
            <div className="w-full h-1 bg-gray-700 mt-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        
        {/* Current step indicator */}
        <div className="ml-4 text-xs text-gray-500 uppercase tracking-wider">
          {currentStep}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
