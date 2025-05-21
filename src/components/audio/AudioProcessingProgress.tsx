import React from 'react';

interface AudioProcessingProgressProps {
  /**
   * Progress value (0-100)
   */
  progress: number;
  
  /**
   * Current processing step description
   */
  step: string;
  
  /**
   * Whether the processing is complete
   */
  isComplete?: boolean;
  
  /**
   * Error message if processing failed
   */
  error?: string;
  
  /**
   * Additional CSS class name
   */
  className?: string;
  
  /**
   * Color of the progress bar
   */
  progressColor?: string;
  
  /**
   * Color of the progress bar when complete
   */
  completeColor?: string;
  
  /**
   * Color of the progress bar when error occurs
   */
  errorColor?: string;
}

/**
 * Component for displaying audio processing progress
 */
const AudioProcessingProgress: React.FC<AudioProcessingProgressProps> = ({
  progress,
  step,
  isComplete = false,
  error,
  className = '',
  progressColor = '#2196f3',
  completeColor = '#4caf50',
  errorColor = '#f44336',
}: any) => {
  // Determine the color of the progress bar
  const barColor = error ? errorColor : (isComplete ? completeColor : progressColor);
  
  // Ensure progress is within bounds
  const boundedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`audio-processing-progress ${className}`} style={{ width: '100%' }}>
      <div className="progress-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="progress-step">{step}</span>
        <span className="progress-percentage">{boundedProgress.toFixed(0)}%</span>
      </div>
      
      <div 
        className="progress-bar-container" 
        style={{ 
          width: '100%', 
          height: '8px', 
          backgroundColor: '#e0e0e0', 
          borderRadius: '4px', 
          overflow: 'hidden' 
        }}
      >
        <div 
          className="progress-bar" 
          style={{ 
            width: `${boundedProgress}%`, 
            height: '100%', 
            backgroundColor: barColor, 
            transition: 'width 0.3s ease-in-out' 
          }} 
        />
      </div>
      
      {error && (
        <div 
          className="progress-error" 
          style={{ 
            color: errorColor, 
            marginTop: '8px', 
            fontSize: '14px' 
          }}
        >
          Error: {error}
        </div>
      )}
      
      {isComplete && !error && (
        <div 
          className="progress-complete" 
          style={{ 
            color: completeColor, 
            marginTop: '8px', 
            fontSize: '14px' 
          }}
        >
          Processing complete!
        </div>
      )}
    </div>
  );
};

export default AudioProcessingProgress;
