import React from 'react';
import { StyledStepper } from './StyledStepper';
import { Loading } from './AsyncStates';
import { ApplicationStep } from '../types/UITypes';

interface WorkflowStepperProps {
  currentStep: ApplicationStep;
  isProcessing?: boolean;
  progressPercentage?: number;
  statusMessage?: string;
  onStepClick?: (step: ApplicationStep) => void;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
}

/**
 * Maps ApplicationStep enum values to user-friendly labels and descriptions
 */
const stepConfig = {
  [ApplicationStep.WELCOME]: {
    label: 'Welcome',
    description: 'Get started with CineFlux',
  },
  [ApplicationStep.FILE_UPLOAD]: {
    label: 'Upload',
    description: 'Select media files',
  },
  [ApplicationStep.MEDIA_ANALYSIS]: {
    label: 'Analysis',
    description: 'Process media content',
  },
  [ApplicationStep.EDIT_CONFIGURATION]: {
    label: 'Configure',
    description: 'Set editing parameters',
  },
  [ApplicationStep.PREVIEW]: {
    label: 'Preview',
    description: 'Review the results',
  },
  [ApplicationStep.EXPORT]: {
    label: 'Export',
    description: 'Generate final output',
  },
  [ApplicationStep.SETTINGS]: {
    label: 'Settings',
    description: 'Adjust preferences',
  },
};

// Order of steps in the workflow (excluding settings which is accessible from anywhere)
const workflowOrder = [
  ApplicationStep.WELCOME,
  ApplicationStep.FILE_UPLOAD,
  ApplicationStep.MEDIA_ANALYSIS,
  ApplicationStep.EDIT_CONFIGURATION,
  ApplicationStep.PREVIEW,
  ApplicationStep.EXPORT,
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStep,
  isProcessing = false,
  progressPercentage = 0,
  statusMessage,
  onStepClick,
  orientation = 'horizontal',
  disabled = false,
}: any) => {
  // Get the current step index
  const currentStepIndex = workflowOrder.indexOf(currentStep);
  
  // Format steps for the StyledStepper component
  const steps = workflowOrder.map((step: any) => ({
    label: stepConfig[step].label,
    description: stepConfig[step].description,
  }));

  // Handle step click
  const handleStepClick = (index: number) => {
    if (onStepClick && !disabled) {
      onStepClick(workflowOrder[index]);
    }
  };

  return (
    <div className="relative">
      {/* Main stepper component */}
      <StyledStepper
        steps={steps}
        activeStep={currentStepIndex}
        onStepClick={handleStepClick}
        orientation={orientation}
        disabled={disabled || isProcessing}
      />
      
      {/* Processing overlay */}
      {isProcessing && (
        <div className="mt-md animate-fade-in">
          <div className="flex items-center">
            <div className="flex-1 mr-md">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${progressPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
            <span className="text-secondary">{progressPercentage}%</span>
          </div>
          
          <div className="flex items-center mt-sm">
            <div className="w-5 h-5 mr-sm">
              <Loading size="sm" />
            </div>
            <span className="text-secondary">
              {statusMessage || `Processing ${stepConfig[currentStep].label.toLowerCase()}...`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowStepper;
