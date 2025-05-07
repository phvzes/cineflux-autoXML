import React from 'react';
import { colorPalette } from '../theme';

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
  const getStepColor = () => {
    if (isCompleted) return colorPalette.subtleGreen;
    if (isActive) return colorPalette.subtleOrange;
    return colorPalette.darkGrey;
  };

  const getTextColor = () => {
    if (isActive || isCompleted) return colorPalette.offWhite;
    return colorPalette.lightGrey;
  };

  return (
    <div
      className="flex flex-col items-center"
      role="listitem"
      aria-current={isActive ? 'step' : undefined}
    >
      <button
        className={`
          flex items-center justify-center
          w-10 h-10 rounded-full
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${colorPalette.richBlack}
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `}
        style={{
          backgroundColor: getStepColor(),
          color: colorPalette.offWhite,
          boxShadow: isActive ? '0 0 0 4px rgba(255, 122, 69, 0.2)' : 'none',
        }}
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
        <div
          className="font-medium transition-colors duration-300"
          style={{ color: getTextColor() }}
        >
          {label}
        </div>
        {description && (
          <div className="text-xs mt-1" style={{ color: colorPalette.lightGrey }}>
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
  const connectorStyles = {
    backgroundColor: isCompleted ? colorPalette.subtleOrange : colorPalette.darkGrey,
    transition: 'background-color 300ms ease-in-out',
  };

  return orientation === 'horizontal' ? (
    <div className="flex-1 flex items-center mx-2">
      <div
        className="h-1 w-full rounded-full"
        style={connectorStyles}
        role="presentation"
      />
    </div>
  ) : (
    <div className="h-8 w-1 my-1 mx-auto" style={connectorStyles} role="presentation" />
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

  return (
    <div
      className={`flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} w-full`}
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
