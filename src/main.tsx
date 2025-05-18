// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProjectProvider } from './context/ProjectContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AnalysisProvider } from './context/AnalysisContext';
import { configureWasmLoading } from './utils/wasmLoader';
import { perfMonitor } from './utils/perfMonitor';
import { initBrowserCompat, getBrowserCompatInfo } from './utils/compat';
import { prefetchCriticalResources } from './utils/prefetch';
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
const initializeApp = () => {
  // Start performance monitoring
  perfMonitor.mark('app-init-start');
  
  // Check browser compatibility
  const compatInfo = getBrowserCompatInfo();
  if (import.meta.env.DEV) {
    console.log('Browser compatibility:', compatInfo);
  }
  
  // Initialize browser compatibility warnings
  initBrowserCompat();
  
  // Configure WebAssembly loading
  configureWasmLoading();
  
  // Configure feature flags
  configureFeatureFlags();
  
  // Prefetch critical resources
  prefetchCriticalResources({
    wasmModules: ['ffmpeg-core.wasm', 'opencv.wasm'],
    images: [
      // Add critical UI images here if needed
    ],
    scripts: [
      // Add critical scripts here if needed
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
  
  // Track time to interactive
  perfMonitor.trackTimeToInteractive(tti => {
    if (import.meta.env.DEV) {
      console.log(`Time to interactive: ${tti.toFixed(2)}ms`);
    }
  });
};

// Add feature flags type to window
declare global {
  interface Window {
    __FEATURE_FLAGS__: Record<string, boolean>;
  }
}

// Initialize the application
initializeApp();
