
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProjectProvider } from './context/ProjectContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AnalysisProvider } from './context/AnalysisContext';
import wasmLoader from './utils/wasm/wasmLoader';
import PerfMonitor from './utils/performance/perfMonitor';
import { isWebAssemblySupported, getCompatibilityReport } from './utils/compat';
import prefetch from './utils/performance/prefetch';
import './index.css';

// Log application version and environment
console.log(`CineFlux-AutoXML v${import.meta.env.VITE_APP_VERSION} (${import.meta.env.MODE})`);

// Configure feature flags from environment variables
const configureFeatureFlags = () => {
  try {
    const featureFlagsStr = import.meta.env.VITE_FEATURE_FLAGS || '{}';
    const featureFlags = JSON.parse(featureFlagsStr);
    
    // Apply feature flags to window object for global access
    window.__FEATURE_FLAGS__ = featureFlags;
    
    // Log enabled features in development mode
    if (import.meta.env.DEV) {
      console.log('Enabled features:', Object.entries(featureFlags)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature)
      );
    }
  } catch (error) {
    console.error('Failed to parse feature flags:', error);
    window.__FEATURE_FLAGS__ = {};
  }
};

// Initialize application
const initializeApp = async () => {
  // Start performance monitoring for critical workflow
  PerfMonitor.startMeasure('app-init-start');
  
  // Register app initialization as a critical workflow step
  PerfMonitor.registerCriticalWorkflowStep('app-initialization', 'Application Initialization');
  
  // Check browser compatibility
  const compatInfo = getCompatibilityReport();
  if (import.meta.env.DEV) {
    console.log('Browser compatibility:', compatInfo);
  }
  
  // Check WebAssembly support
  if (!isWebAssemblySupported()) {
    console.warn('WebAssembly is not supported in this browser. Some features may not work properly.');
  }
  
  // Configure feature flags
  configureFeatureFlags();
  
  // Configure WebAssembly loading - this now preloads critical modules
  await wasmLoader.preloadWasmModules();
  
  // Prefetch critical resources
  await prefetch.prefetchCriticalResources().catch(error => {
    console.warn('Failed to prefetch some resources:', error);
  });
  
  // Mark performance for time to initialize
  const initEndId = PerfMonitor.startMeasure('app-init-end');
  PerfMonitor.stopMeasure(initEndId);
  
  // Render the application
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <ProjectProvider>
          <WorkflowProvider>
            <AnalysisProvider>
              <App />
            </AnalysisProvider>
          </WorkflowProvider>
        </ProjectProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

// Add feature flags type to window
declare global {
  interface Window {
    __FEATURE_FLAGS__: Record<string, boolean>;
  }
}

// Initialize the application
initializeApp();
