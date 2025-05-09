/**
 * App.tsx
 * 
 * Main application entry point with routing setup for the CineFlux-AutoXML application.
 */

import React, { Suspense, lazy, useRef, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useProject } from './context/ProjectContext';
import { useAnalysis } from './context/AnalysisContext';
import Loading from './components/Loading';
import WelcomePage from './components/welcome/WelcomePage';

// Import main container
import WorkflowContainer from './components/WorkflowContainer';

// Lazy load step components for better performance
const InputStep = lazy(() => import('./components/steps/InputStep'));
const AnalysisStep = lazy(() => import('./components/steps/AnalysisStep'));
const EditingStep = lazy(() => import('./components/steps/EditingStep'));
const PreviewStep = lazy(() => import('./components/steps/PreviewStep'));
const ExportStep = lazy(() => import('./components/steps/ExportStep'));

export default function App() {
  const { state: projectState, dispatch } = useProject();
  const { state: analysisState } = useAnalysis();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
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
  
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Welcome page route */}
        <Route path="/welcome" element={<WelcomePage onGetStarted={() => dispatch({ type: 'SET_STEP', payload: 'input' })} />} />
        
        {/* Main workflow routes nested under WorkflowContainer */}
        <Route path="/" element={<WorkflowContainer />}>
          <Route index element={<Navigate to="/input" replace />} />
          <Route path="input" element={
            <Suspense fallback={<Loading message="Loading input step..." />}>
              <InputStep />
            </Suspense>
          } />
          <Route path="analysis" element={
            <Suspense fallback={<Loading message="Loading analysis step..." />}>
              <AnalysisStep />
            </Suspense>
          } />
          <Route path="editing" element={
            <Suspense fallback={<Loading message="Loading editing step..." />}>
              <EditingStep audioElement={audioElementRef.current} />
            </Suspense>
          } />
          <Route path="preview" element={
            <Suspense fallback={<Loading message="Loading preview step..." />}>
              <PreviewStep audioElement={audioElementRef.current} />
            </Suspense>
          } />
          <Route path="export" element={
            <Suspense fallback={<Loading message="Loading export step..." />}>
              <ExportStep />
            </Suspense>
          } />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </Suspense>
  );
}
