/**
 * Consolidated types export file
 * 
 * This file re-exports all the types from the consolidated directory
 * to provide a single import point for the application.
 */

// Re-export all types from the consolidated directory
export * from './consolidated/index';

// Import ProjectSettingsFix instead to avoid circular dependencies
export * from './ProjectSettingsFix';
