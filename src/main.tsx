
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProjectProvider } from './context/ProjectContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AnalysisProvider } from './context/AnalysisContext';
import { configureWasmLoading } from './utils/wasm/wasmLoader';
import { perfMonitor } from './utils/performance/perfMonitor';
import { initBrowserCompat, getBrowserCompatInfo } from './utils/compat';
import { prefetchCriticalResources, PrefetchPriority } from './utils/performance/prefetch';
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
  perfMonitor.mark('app-init-start');
  
  // Register app initialization as a critical workflow step
  perfMonitor.registerCriticalWorkflowStep('app-initialization');
  
  // Check browser compatibility
  const compatInfo = getBrowserCompatInfo();
  if (import.meta.env.DEV) {
    console.log('Browser compatibility:', compatInfo);
  }
  
  // Initialize browser compatibility warnings
  initBrowserCompat();
  
  // Configure feature flags
  configureFeatureFlags();
  
  // Configure WebAssembly loading - this now preloads critical modules
  await configureWasmLoading();
  
  // Prefetch critical resources with priority
  await prefetchCriticalResources({
    wasmModules: [
      { path: 'ffmpeg-core.wasm', priority: PrefetchPriority.CRITICAL },
      { path: 'opencv.wasm', priority: PrefetchPriority.CRITICAL }
    ],
    scripts: [
      // Add critical scripts with priorities
      { url: '/assets/critical-vendor.js', priority: PrefetchPriority.HIGH }
    ],
    stylesheets: [
      // Add critical stylesheets with priorities
      { url: '/assets/critical-styles.css', priority: PrefetchPriority.HIGH }
    ],
    images: [
      // Add critical UI images with priorities
      { url: '/assets/logo.svg', priority: PrefetchPriority.MEDIUM }
    ]
  }).catch(error => {
    console.warn('Failed to prefetch some resources:', error);
  });
  
  // Mark performance for time to initialize
  perfMonitor.mark('app-init-end');
  perfMonitor.measure('app-initialization', 'app-init-start', 'app-init-end');
  
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
