/**
 * WorkflowStep.ts
 * 
 * This file defines the WorkflowStep enum for representing different steps in the workflow.
 */

/**
 * Enum defining different workflow steps
 */
export enum WorkflowStep {
  WELCOME = 'welcome',
  INPUT = 'input',
  ANALYSIS = 'analysis',
  EDITING = 'editing',
  PREVIEW = 'preview',
  EXPORT = 'export'
}

export default WorkflowStep;
