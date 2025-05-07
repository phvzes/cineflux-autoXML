import React from 'react';

interface StepProps {
  label: string;
  description?: string;
  isActive: boolean;
  isCompleted: boolean;
  index: number;
  onClick?: () => void;
  disabled?: boolean;
}

interface StepperProps {
  steps: Array<{
    label: string;
    description?: string;
  }>;
  activeStep: number;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
}

const Step: React.FC<StepProps> = ({
  label,
  description,
  isActive,
  isCompleted,
  index,
  onClick,
  disabled = false,
}) => {
  // Determine step button class based on state
  const stepButtonClass = `
    step-button
    ${isActive ? 'step-button-active' : ''}
    ${isCompleted ? 'step-button-completed' : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
  `;

  // Determine label class based on state
  const labelClass = `
    step-label
    ${isActive || isCompleted ? 'step-label-active' : ''}
  `;

  return (
    <div
      className="flex flex-col items-center"
      role="listitem"
      aria-current={isActive ? 'step' : undefined}
    >
      <button
        className={stepButtonClass}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={`Step ${index + 1}: ${label} ${isCompleted ? '(completed)' : isActive ? '(current)' : ''}`}
        aria-disabled={disabled}
      >
        {isCompleted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span>{index + 1}</span>
        )}
      </button>
      <div className="mt-2 text-center">
        <div className={labelClass}>
          {label}
        </div>
        {description && (
          <div className="step-description">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

const StepConnector: React.FC<{
  isCompleted: boolean;
  orientation?: 'horizontal' | 'vertical';
}> = ({ isCompleted, orientation = 'horizontal' }) => {
  const connectorClass = `
    step-connector
    ${isCompleted ? 'step-connector-completed' : ''}
  `;

  return orientation === 'horizontal' ? (
    <div className="flex-1 flex items-center mx-2">
      <div
        className={connectorClass}
        role="presentation"
      />
    </div>
  ) : (
    <div className="h-8 w-1 my-1 mx-auto" role="presentation">
      <div className={connectorClass} style={{ height: '100%' }} />
    </div>
  );
};

export const StyledStepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  onStepClick,
  orientation = 'horizontal',
  disabled = false,
}) => {
  const isStepClickable = (index: number): boolean => {
    // Only allow clicking on completed steps or the next available step
    return !disabled && (index <= activeStep || index === activeStep + 1);
  };

  const handleStepClick = (index: number) => {
    if (isStepClickable(index) && onStepClick) {
      onStepClick(index);
    }
  };

  const stepperClass = `
    stepper
    ${orientation === 'vertical' ? 'stepper-vertical' : ''}
  `;

  return (
    <div
      className={stepperClass}
      role="list"
      aria-label="Workflow steps"
    >
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <Step
            label={step.label}
            description={step.description}
            isActive={index === activeStep}
            isCompleted={index < activeStep}
            index={index}
            onClick={() => handleStepClick(index)}
            disabled={!isStepClickable(index) || disabled}
          />
          {index < steps.length - 1 && (
            <StepConnector
              isCompleted={index < activeStep}
              orientation={orientation}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StyledStepper;
