
/**
 * LazyComponents.tsx
 * 
 * This file defines lazy-loaded components for the application.
 * Components that are not needed immediately are loaded only when required,
 * improving initial load performance.
 */

import React from 'react';
import { namedLazy, preloadComponent } from '../utils/lazy';

// Lazy load edit-decision components
export const EditDecisionControls = namedLazy(
  () => import('./edit-decision/EditDecisionControls'),
  'EditDecisionControls'
);

export const EditDecisionVisualizer = namedLazy(
  () => import('./edit-decision/EditDecisionVisualizer'),
  'EditDecisionVisualizer'
);

export const EditPreview = namedLazy(
  () => import('./edit-decision/EditPreview'),
  'EditPreview'
);

// Lazy load export components
export const ExportModal = namedLazy(
  () => import('./export/ExportModal'),
  'ExportModal'
);

// Lazy load video components
export const VideoAnalyzer = namedLazy(
  () => import('./video/VideoAnalyzer'),
  'VideoAnalyzer'
);

export const VideoAnalysisVisualizer = namedLazy(
  () => import('./video/VideoAnalysisVisualizer'),
  'VideoAnalysisVisualizer'
);

export const ThumbnailGrid = namedLazy(
  () => import('./video/ThumbnailGrid'),
  'ThumbnailGrid'
);

// Lazy load workflow step components
export const AnalysisStep = namedLazy(
  () => import('./steps/AnalysisStep'),
  'AnalysisStep'
);

export const EditingStep = namedLazy(
  () => import('./steps/EditingStep'),
  'EditingStep'
);

export const ExportStep = namedLazy(
  () => import('./steps/ExportStep'),
  'ExportStep'
);

export const PreviewStep = namedLazy(
  () => import('./steps/PreviewStep'),
  'PreviewStep'
);

// InputStep is often needed early, so we don't lazy load it
// import InputStep from './steps/InputStep';
// export { InputStep };

/**
 * Preload components that will be needed soon based on the current workflow step
 * 
 * @param currentStep - Current workflow step
 */
export const preloadNextComponents = (currentStep: string): void => {
  switch (currentStep) {
    case 'input':
      // Preload components needed for the analysis step
      preloadComponent(() => import('./steps/AnalysisStep'), 'AnalysisStep');
      preloadComponent(() => import('./video/VideoAnalyzer'), 'VideoAnalyzer');
      break;
    
    case 'analysis':
      // Preload components needed for the editing step
      preloadComponent(() => import('./steps/EditingStep'), 'EditingStep');
      preloadComponent(() => import('./edit-decision/EditDecisionControls'), 'EditDecisionControls');
      preloadComponent(() => import('./edit-decision/EditDecisionVisualizer'), 'EditDecisionVisualizer');
      break;
    
    case 'editing':
      // Preload components needed for the preview step
      preloadComponent(() => import('./steps/PreviewStep'), 'PreviewStep');
      preloadComponent(() => import('./edit-decision/EditPreview'), 'EditPreview');
      break;
    
    case 'preview':
      // Preload components needed for the export step
      preloadComponent(() => import('./steps/ExportStep'), 'ExportStep');
      preloadComponent(() => import('./export/ExportModal'), 'ExportModal');
      break;
    
    default:
      // No preloading for unknown steps
      break;
  }
};

export default {
  EditDecisionControls,
  EditDecisionVisualizer,
  EditPreview,
  ExportModal,
  VideoAnalyzer,
  VideoAnalysisVisualizer,
  ThumbnailGrid,
  AnalysisStep,
  EditingStep,
  ExportStep,
  PreviewStep,
  preloadNextComponents,
};
