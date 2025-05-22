
/**
 * Central export hub for every shared TypeScript type in the application.
 *
 * Import from `src/types` to gain access to any of the domain, state,
 * settings, or UI interfaces without touching individual definition files.
 * This keeps imports short, centralized, and easy to maintain.
 */

/* ---------- Media analysis ---------- */
export * from './audio.types';
export * from './video.types';

/* ---------- Editing & decisions ----- */
export * from './edit.types';

/* ---------- Project configuration --- */
export * from './project.types';

/* ---------- Global application state */
export * from './application.types';

/* ---------- UI / View layer --------- */
export * from './ui.types';
