/**
 * WorkflowStepper.tsx
 * 
 * This component displays the workflow steps and allows navigation between them.
 * It shows the current step and indicates which steps are accessible.
 */

import React from 'react';
import { WorkflowStep } from '../../types/workflow';
import { useWorkflow } from '../../context/WorkflowContext';

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  hasAnalysisResults?: boolean;
  hasEditDecisions?: boolean;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStep,
  hasAnalysisResults = false,
  hasEditDecisions = false
}) => {
  const { navigation } = useWorkflow();
  
  // Define the steps in order
  const steps = [
    { id: WorkflowStep.INPUT, label: 'Input', icon: '📁' },
    { id: WorkflowStep.ANALYSIS, label: 'Analysis', icon: '📊' },
    { id: WorkflowStep.EDIT, label: 'Edit', icon: '✂️' },
    { id: WorkflowStep.PREVIEW, label: 'Preview', icon: '👁️' },
    { id: WorkflowStep.EXPORT, label: 'Export', icon: '📤' }
  ];
  
  // Determine if a step is accessible
  const canAccessStep = (step: WorkflowStep): boolean => {
    switch (step) {
      case WorkflowStep.INPUT:
        return true; // Always accessible
      case WorkflowStep.ANALYSIS:
        return true; // Accessible if we have a music file (would be checked in component)
      case WorkflowStep.EDIT:
        return hasAnalysisResults; // Need analysis results
      case WorkflowStep.PREVIEW:
        return hasAnalysisResults && hasEditDecisions; // Need both analysis and edit decisions
      case WorkflowStep.EXPORT:
        return hasAnalysisResults && hasEditDecisions; // Need both analysis and edit decisions
      default:
        return false;
    }
  };
  
  // Handle step click
  const handleStepClick = (step: WorkflowStep) => {
    if (canAccessStep(step)) {
      navigation.goToStep(step);
    }
  };
  
  return (
    <div className="workflow-stepper">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        {steps.map((step, index) => {
          // Determine if this step is the current one
          const isCurrentStep = step.id === currentStep;
          
          // Determine if this step is accessible
          const isAccessible = canAccessStep(step.id);
          
          // Determine if this step is completed
          const isCompleted = (() => {
            switch (step.id) {
              case WorkflowStep.INPUT:
                return true; // Always considered completed
              case WorkflowStep.ANALYSIS:
                return hasAnalysisResults;
              case WorkflowStep.EDIT:
                return hasEditDecisions;
              case WorkflowStep.PREVIEW:
                return hasEditDecisions; // Preview is completed if we have edit decisions
              case WorkflowStep.EXPORT:
                return false; // Export is never "completed" in the stepper
              default:
                return false;
            }
          })();
          
          // Determine the step status class
          const stepStatusClass = isCurrentStep
            ? 'bg-blue-500 text-white'
            : isCompleted
              ? 'bg-green-500 text-white'
              : isAccessible
                ? 'bg-gray-700 text-white cursor-pointer hover:bg-gray-600'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed';
          
          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div 
                className={`step-circle flex flex-col items-center`}
                onClick={() => handleStepClick(step.id)}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${stepStatusClass} transition-colors duration-200`}
                >
                  <span className="text-lg">{step.icon}</span>
                </div>
                <span className={`mt-2 text-sm ${isCurrentStep ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              
              {/* Connector line (except after the last step) */}
              {index < steps.length - 1 && (
                <div className="flex-grow mx-2 h-1 bg-gray-700">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ 
                      width: isCompleted ? '100%' : '0%',
                      transition: 'width 0.3s ease-in-out'
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
