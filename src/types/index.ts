/**
 * Central export hub for every shared TypeScript type in the application.
 *
 * Import from `src/types` to gain access to any of the domain, state,
 * settings, or UI interfaces without touching individual definition files.
 * This keeps imports short, centralised, and easy to maintain.
 */

/* ---------- Media analysis ---------- */
export * from './audio-types';
export * from './video-types';
export * from './media-processing';

/* ---------- Editing & decisions ----- */
export * from './workflow-types';
export * from './EditDecision';
export * from './edit-types';

/* ---------- Configuration ----------- */
export * from './ProjectSettings';

/* ---------- Global application state */
export * from './ApplicationState';

/* ---------- File handling ----------- */
export * from './FileTypes';
export * from './VideoFile';

/* ---------- UI / View layer --------- */
export * from './UITypes';
