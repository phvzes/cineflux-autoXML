
import React from 'react';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';

export interface ProcessingStage {
  id: string;
  label: string;
  percentage: number; // What percentage of the total process this stage represents
}

export interface ProcessingProgressProps {
  stages: ProcessingStage[];
  currentStage: string;
  progress: number; // 0-100
  error?: string | null;
  isComplete?: boolean;
  onRetry?: () => void;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  stages,
  currentStage,
  progress,
  error = null,
  isComplete = false,
  onRetry
}) => {
  // Calculate the overall progress based on completed stages and current progress
  const calculateOverallProgress = () => {
    if (isComplete) return 100;
    if (error) return progress;
    
    const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentStageIndex === -1) return 0;
    
    // Sum up percentages of completed stages
    const completedStagesPercentage = stages
      .slice(0, currentStageIndex)
      .reduce((sum, stage) => sum + stage.percentage, 0);
    
    // Add the progress of the current stage
    const currentStageProgress = (progress / 100) * stages[currentStageIndex].percentage;
    
    return completedStagesPercentage + currentStageProgress;
  };

  const overallProgress = calculateOverallProgress();
  const boundedProgress = Math.min(100, Math.max(0, overallProgress));
  
  // Determine the color of the progress bar based on state
  const getBarColor = () => {
    if (error) return '#F56565'; // Red for error
    if (isComplete) return '#48BB78'; // Green for complete
    return '#FF7A45'; // Orange for in progress (CineFlux brand color)
  };

  // Get the current stage label
  const getCurrentStageLabel = () => {
    const stage = stages.find(s => s.id === currentStage);
    return stage ? stage.label : 'Processing';
  };

  return (
    <div className="processing-progress w-full max-w-md mx-auto bg-[#1A1A1F] p-4 rounded-lg shadow-md">
      {/* Header with status icon */}
      <div className="flex items-center mb-3">
        {error ? (
          <AlertCircle className="mr-2 text-[#F56565]" size={20} />
        ) : isComplete ? (
          <CheckCircle className="mr-2 text-[#48BB78]" size={20} />
        ) : (
          <Loader className="mr-2 text-[#FF7A45] animate-spin" size={20} />
        )}
        <h3 className="text-[#F5F5F7] font-medium">
          {error ? 'Processing Error' : isComplete ? 'Processing Complete' : 'Processing in Progress'}
        </h3>
      </div>

      {/* Main progress bar */}
      <div className="w-full bg-[#2A2A30] rounded-full h-4 mb-3">
        <div 
          className="h-4 rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${boundedProgress}%`,
            backgroundColor: getBarColor()
          }}
        ></div>
      </div>

      {/* Progress details */}
      <div className="flex justify-between text-sm mb-4">
        <span className="text-[#F5F5F7]">{getCurrentStageLabel()}</span>
        <span className="text-[#F5F5F7] font-medium">{Math.round(boundedProgress)}%</span>
      </div>

      {/* Stage indicators */}
      <div className="flex justify-between mb-2">
        {stages.map((stage, index) => {
          const stageIndex = stages.findIndex(s => s.id === currentStage);
          const isCompleted = index < stageIndex;
          const isCurrent = stage.id === currentStage;
          
          return (
            <div key={stage.id} className="flex flex-col items-center">
              <div 
                className={`w-4 h-4 rounded-full mb-1 ${isCompleted ? 'bg-[#48BB78]' : isCurrent ? 'bg-[#FF7A45]' : 'bg-[#2A2A30]'}`}
              ></div>
              <span className="text-xs text-[#A0A0A7] max-w-[60px] text-center truncate" title={stage.label}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error message and retry button */}
      {error && (
        <div className="mt-3 p-3 bg-[#2A2A30] rounded-md">
          <p className="text-sm text-[#F56565] mb-2">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="text-sm bg-[#F56565] text-white py-1 px-3 rounded hover:bg-[#E53E3E] transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Success message */}
      {isComplete && (
        <div className="mt-3 p-3 bg-[#2A2A30] rounded-md">
          <p className="text-sm text-[#48BB78]">Processing completed successfully!</p>
        </div>
      )}
    </div>
  );
};

export default ProcessingProgress;
