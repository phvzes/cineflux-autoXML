/**
 * Central export hub for every shared TypeScript type in the application.
 *
 * Import from `src/types` to gain access to any of the domain, state,
 * settings, or UI interfaces without touching individual definition files.
 * This keeps imports short, centralised, and easy to maintain.
 */

/* ---------- Media analysis ---------- */
export * from './AudioAnalysis';
export * from './VideoAnalysis';
export * from './audio-types';
export * from './video-types';

/* ---------- Editing & decisions ----- */
export * from './EditDecision';
export * from './edit-types';

/* ---------- Workflow ---------- */
export * from './workflow-types';
export * from './workflow';

/* ---------- Configuration ----------- */
export * from './ProjectSettings';

/* ---------- Global application state */
export * from './ApplicationState';

/* ---------- File handling ----------- */
export * from './FileTypes';

/* ---------- UI / View layer --------- */
export * from './UITypes';
