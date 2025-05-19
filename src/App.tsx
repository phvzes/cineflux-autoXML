/**
 * App.tsx
 * 
 * Main application entry point with routing setup for the CineFlux-AutoXML application.
 * Optimized with code splitting and lazy loading for better performance.
 */

import React, { Suspense, lazy, useRef, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useProject } from './context/ProjectContext';
import { useAnalysis } from './context/AnalysisContext';
import Loading from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import errorLogger from './utils/errorLogger';

// Lazy load contexts and providers to reduce initial bundle size
const NotificationProvider = lazy(() => 
  import('./contexts/NotificationContext').then(module => ({
    default: module.NotificationProvider
  }))
);

// Lazy load welcome page with custom chunk name
const WelcomePage = lazy(() => 
  import(/* webpackChunkName: "welcome" */ './components/welcome/WelcomePage')
);

// Lazy load main container with custom chunk name
const WorkflowContainer = lazy(() => 
  import(/* webpackChunkName: "workflow-container" */ './components/WorkflowContainer')
);

// Lazy load step components with custom chunk names for better performance
const InputStep = lazy(() => 
  import(/* webpackChunkName: "step-input" */ './components/steps/InputStep')
);

const AnalysisStep = lazy(() => 
  import(/* webpackChunkName: "step-analysis" */ './components/steps/AnalysisStep')
);

const EditingStep = lazy(() => 
  import(/* webpackChunkName: "step-editing" */ './components/steps/EditingStep')
);

const PreviewStep = lazy(() => 
  import(/* webpackChunkName: "step-preview" */ './components/steps/PreviewStep')
);

const ExportStep = lazy(() => 
  import(/* webpackChunkName: "step-export" */ './components/steps/ExportStep')
);

export default function App() {
  const { state: projectState, dispatch } = useProject();
  const { state: analysisState } = useAnalysis();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Set up global error handlers
  useEffect(() => {
    errorLogger.setupGlobalErrorHandlers();
  }, []);
  
  // Create audio element for playback
  useEffect(() => {
    const audioElement = new Audio();
    audioElementRef.current = audioElement;
    
    // Clean up
    return () => {
      audioElement.pause();
      audioElement.src = '';
    };
  }, []);
  
  // Set audio source when music file changes
  useEffect(() => {
    if (projectState.musicFile && audioElementRef.current) {
      const audioElement = audioElementRef.current;
      const fileUrl = URL.createObjectURL(projectState.musicFile);
      
      audioElement.src = fileUrl;
      audioElement.load();
      
      // Get duration when metadata is loaded
      audioElement.onloadedmetadata = () => {
        dispatch({ type: 'SET_DURATION', payload: audioElement.duration });
      };
      
      // Update current time during playback
      audioElement.ontimeupdate = () => {
        dispatch({ type: 'SET_PLAYBACK_TIME', payload: audioElement.currentTime });
      };
      
      // Reset playing state when ended
      audioElement.onended = () => {
        dispatch({ type: 'SET_PLAYING', payload: false });
      };
      
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    }
  }, [projectState.musicFile, dispatch]);
  
  // Track the last time we started playback to prevent rapid restarts
  const lastPlaybackStartRef = useRef<number>(0);
  
  // Sync audio playback with state
  useEffect(() => {
    if (audioElementRef.current) {
      if (projectState.isPlaying) {
        const now = Date.now();
        const timeSinceLastStart = now - lastPlaybackStartRef.current;
        
        // Prevent rapid restarts (debounce)
        if (timeSinceLastStart < 300 && audioElementRef.current.paused === false) {
          return;
        }
        
        // Update last playback start time
        lastPlaybackStartRef.current = now;
        
        // Set current time if it's more than 0.2 seconds off
        if (Math.abs(audioElementRef.current.currentTime - projectState.currentTime) > 0.2) {
          audioElementRef.current.currentTime = projectState.currentTime;
        }
        
        audioElementRef.current.play().catch(error => {
          console.error('Playback failed:', error);
          dispatch({ type: 'SET_PLAYING', payload: false });
        });
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [projectState.isPlaying, projectState.currentTime, dispatch]);
  
  // Handle errors in the application
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    errorLogger.logError(error, errorInfo.componentStack);
  };

  // Preload critical resources based on environment
  useEffect(() => {
    // Preload WebAssembly modules if needed
    const preloadWasmModules = async () => {
      if (import.meta.env.PROD) {
        const wasmCdnUrl = import.meta.env.VITE_WASM_CDN_URL;
        
        if (wasmCdnUrl) {
          // Create preload links for critical WASM modules
          const preloadLinks = [
            `${wasmCdnUrl}/ffmpeg-core.wasm`,
            `${wasmCdnUrl}/opencv.wasm`,
          ];
          
          preloadLinks.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'fetch';
            link.href = url;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
          });
        }
      }
    };
    
    preloadWasmModules();
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary onError={handleError}>
        <Suspense fallback={<Loading message="Loading application..." />}>
          <NotificationProvider>
            <Routes>
              {/* Welcome page route */}
              <Route path="/welcome" element={
                <Suspense fallback={<Loading message="Loading welcome page..." />}>
                  <WelcomePage onGetStarted={() => dispatch({ type: 'SET_STEP', payload: 'input' })} />
                </Suspense>
              } />
              
              {/* Main workflow routes nested under WorkflowContainer */}
              <Route path="/" element={
                <Suspense fallback={<Loading message="Loading workflow..." />}>
                  <WorkflowContainer />
                </Suspense>
              }>
                <Route index element={<Navigate to="/input" replace />} />
                <Route path="input" element={
                  <Suspense fallback={<Loading message="Loading input step..." />}>
                    <ErrorBoundary>
                      <InputStep />
                    </ErrorBoundary>
                  </Suspense>
                } />
                <Route path="analysis" element={
                  <Suspense fallback={<Loading message="Loading analysis step..." />}>
                    <ErrorBoundary>
                      <AnalysisStep />
                    </ErrorBoundary>
                  </Suspense>
                } />
                <Route path="editing" element={
                  <Suspense fallback={<Loading message="Loading editing step..." />}>
                    <ErrorBoundary>
                      <EditingStep audioElement={audioElementRef.current} />
                    </ErrorBoundary>
                  </Suspense>
                } />
                <Route path="preview" element={
                  <Suspense fallback={<Loading message="Loading preview step..." />}>
                    <ErrorBoundary>
                      <PreviewStep audioElement={audioElementRef.current} />
                    </ErrorBoundary>
                  </Suspense>
                } />
                <Route path="export" element={
                  <Suspense fallback={<Loading message="Loading export step..." />}>
                    <ErrorBoundary>
                      <ExportStep />
                    </ErrorBoundary>
                  </Suspense>
                } />
              </Route>
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/welcome" replace />} />
            </Routes>
          </NotificationProvider>
        </Suspense>
      </ErrorBoundary>
    </Suspense>
  );
}
