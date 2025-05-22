/**
 * WorkflowStepFix.ts
 * 
 * This file defines the WorkflowStep type as a union of string literals
 * to fix type inconsistencies between enum and string literal usage.
 */

/**
 * Union type defining different workflow steps
 * This fixes the inconsistency between enum values and string literals
 */
export type WorkflowStep = 
  | 'welcome'
  | 'input'
  | 'analysis'
  | 'edit'
  | 'preview'
  | 'export';

/**
 * Helper function to check if a string is a valid WorkflowStep
 */
export function isValidWorkflowStep(step: string): step is WorkflowStep {
  return [
    'welcome',
    'input',
    'analysis',
    'edit',
    'preview',
    'export'
  ].includes(step);
}

/**
 * Helper functions for workflow step navigation
 */
export const WorkflowStepUtils = {
  getNextStep: (currentStep: WorkflowStep): WorkflowStep => {
    switch (currentStep) {
      case 'welcome': return 'input';
      case 'input': return 'analysis';
      case 'analysis': return 'edit';
      case 'edit': return 'preview';
      case 'preview': return 'export';
      case 'export': return 'export'; // No next step after export
    }
  },
  
  getPreviousStep: (currentStep: WorkflowStep): WorkflowStep | null => {
    switch (currentStep) {
      case 'welcome': return null; // No previous step
      case 'input': return 'welcome';
      case 'analysis': return 'input';
      case 'edit': return 'analysis';
      case 'preview': return 'edit';
      case 'export': return 'preview';
    }
  }
};
