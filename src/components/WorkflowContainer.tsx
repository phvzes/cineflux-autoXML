
import React, { useEffect } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import WorkflowStepper from './WorkflowStepper';
import PerfMonitor from '../utils/performance/perfMonitor';
import { preloadNextComponents } from './LazyComponents';

// Import steps
import InputStep from './steps/InputStep';
import { AnalysisStep, EditingStep, PreviewStep, ExportStep } from './LazyComponents';

// Fallback loading component
const LoadingStep = () => (
  <div className="loading-step">
    <div className="loading-spinner"></div>
    <p>Loading step...</p>
  </div>
);

const WorkflowContainer: React.FC = () => {
  const { state, navigation } = useWorkflow();
  const currentStep = state.workflow.currentStep;

  // Track step transitions as critical workflow steps
  useEffect(() => {
    // Mark the start of the step transition
    const stepTransitionName = `workflow-transition-to-${currentStep}`;
    const measureId = PerfMonitor.startMeasure(stepTransitionName);
    
    // Register this as a critical workflow step
    PerfMonitor.registerCriticalWorkflowStep(stepTransitionName, `Transition to ${currentStep}`);
    
    // Preload components for the next step
    preloadNextComponents(currentStep);
    
    // Mark the end of the step transition when the component is mounted
    const timeoutId = setTimeout(() => {
      PerfMonitor.stopMeasure(measureId);
      // Log completion of step transition
      console.debug(`Completed transition to ${currentStep}`);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentStep]);

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'input':
        return <InputStep />;
      case 'analysis':
        return (
          <React.Suspense fallback={<LoadingStep />}>
            <AnalysisStep />
          </React.Suspense>
        );
      case 'editing':
        return (
          <React.Suspense fallback={<LoadingStep />}>
            <EditingStep />
          </React.Suspense>
        );
      case 'preview':
        return (
          <React.Suspense fallback={<LoadingStep />}>
            <PreviewStep />
          </React.Suspense>
        );
      case 'export':
        return (
          <React.Suspense fallback={<LoadingStep />}>
            <ExportStep />
          </React.Suspense>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="workflow-container">
      <WorkflowStepper
        currentStep={currentStep}
        onStepChange={navigation.goToStep}
        isStepComplete={(step) => {
          // Logic to determine if a step is complete
          switch (step) {
            case 'input':
              return Boolean(state.project.musicFile && state.project.videoFiles.length > 0);
            case 'analysis':
              return Boolean(state.analysis.audio && state.analysis.video);
            case 'editing':
              return state.edit.decisions.length > 0;
            case 'export':
              return state.export.exportComplete;
            default:
              return false;
          }
        }}
      />
      <div className="workflow-content">
        {renderStep()}
      </div>
    </div>
  );
};

export default WorkflowContainer;
