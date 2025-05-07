import { useEffect, useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { InputStep } from '@/components/steps/InputStep';
import { AnalysisStep } from '@/components/steps/AnalysisStep';
import { EditingStep } from '@/components/steps/EditingStep';
import { PreviewStep } from '@/components/steps/PreviewStep';
import { ExportModal } from '@/components/export/ExportModal';
import { useProject } from '@/context/ProjectContext';
import AudioService from '@/services/AudioService';
import VideoService from '@/services/VideoService';
import EditService from '@/services/EditService';
import PreviewGenerator from '@/services/PreviewGenerator';

export default function App() {
  const { state, dispatch } = useProject();
  const [showExportModal, setShowExportModal] = useState(false);
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
    if (state.musicFile && audioElementRef.current) {
      const audioElement = audioElementRef.current;
      const fileUrl = URL.createObjectURL(state.musicFile);
      
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
  }, [state.musicFile, dispatch]);
  
  // Sync audio playback with state
  useEffect(() => {
    if (audioElementRef.current) {
      if (state.isPlaying) {
        // Set current time if it's more than 0.5 seconds off
        if (Math.abs(audioElementRef.current.currentTime - state.currentTime) > 0.5) {
          audioElementRef.current.currentTime = state.currentTime;
        }
        
        audioElementRef.current.play().catch(error => {
          console.error('Playback failed:', error);
          dispatch({ type: 'SET_PLAYING', payload: false });
        });
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [state.isPlaying, state.currentTime, dispatch]);
  
  // Handle new project
  const handleNewProject = () => {
    if (state.isAnalyzing) return;
    
    if (state.musicFile || state.videoFiles.length > 0) {
      if (window.confirm('Are you sure you want to create a new project? All unsaved work will be lost.')) {
        dispatch({ type: 'SET_STEP', payload: 'input' });
        dispatch({ type: 'SET_MUSIC_FILE', payload: null });
        dispatch({ type: 'SET_VIDEO_FILES', payload: [] });
        dispatch({ type: 'SET_AUDIO_ANALYSIS', payload: null });
        dispatch({ type: 'SET_VIDEO_ANALYSES', payload: {} });
        dispatch({ type: 'SET_EDIT_DECISIONS', payload: [] });
        dispatch({ type: 'SET_PLAYBACK_TIME', payload: 0 });
        
        // Clean up audio element
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.src = '';
        }
        
        // Clear preview cache
        PreviewGenerator.clearCache();
      }
    }
  };
  
  // Handle open project
  const handleOpenProject = () => {
    // In a real app, this would open a file dialog
    alert('Open project functionality would be implemented here');
  };
  
  // Handle save project
  const handleSaveProject = () => {
    // In a real app, this would save the project
    alert('Save project functionality would be implemented here');
  };
  
  // Handle export
  const handleExport = () => {
    setShowExportModal(true);
  };
  
  // Render the appropriate step
  const renderStep = () => {
    switch (state.currentStep) {
      case 'input':
        return <InputStep />;
      case 'analyzing':
        return <AnalysisStep />;
      case 'editing':
        return <EditingStep audioElement={audioElementRef.current} />;
      case 'preview':
        return <PreviewStep audioElement={audioElementRef.current} />;
      default:
        return <InputStep />;
    }
  };
  
  // Create a map of video files by ID
  const videoFilesById: Record<string, File> = {};
  state.videoFiles.forEach(file => {
    const analyses = state.videoAnalyses;
    // Find the analysis for this file
    for (const id in analyses) {
      if (analyses[id].clip.name === file.name) {
        videoFilesById[id] = file;
        break;
      }
    }
  });
  
  return (
    <AppLayout
      onNewProject={handleNewProject}
      onOpenProject={handleOpenProject}
      onSaveProject={handleSaveProject}
      onExport={handleExport}
    >
      {renderStep()}
      
      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          editDecisions={state.editDecisions}
          videoFiles={videoFilesById}
          audioFile={state.musicFile}
          settings={state.settings}
          duration={state.duration}
        />
      )}
    </AppLayout>
  );
}
