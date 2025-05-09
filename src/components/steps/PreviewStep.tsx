/**
 * PreviewStep.tsx
 * 
 * This component represents the preview step in the workflow where
 * users can see a full preview of the edited video.
 */

import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { EditDecision } from '../../types/workflow';
import { PreviewWrapper } from '../preview';
import { EditDecisionList, createEmptyEDL, TransitionType, MarkerType, TrackType } from '../../types/EditDecision';
import { editDecisionEngine } from '../../engine/EditDecisionEngine';

// Import icons 
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  Edit,
  FileUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PreviewStepProps {
  audioElement?: HTMLAudioElement | null;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ audioElement }) => {
  // Get workflow context
  const { state, navigation, actions } = useWorkflow();
  
  // Local state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [edl, setEdl] = useState<EditDecisionList | null>(null);
  const [videoSources, setVideoSources] = useState<Record<string, string>>({});
  
  // Create a sample EDL for testing
  useEffect(() => {
    // Create an empty EDL
    const sampleEdl = createEmptyEDL('Preview EDL', 30);
    
    // Add clips from the project's video files
    const videoFiles = state.project.rawVideoFiles.length > 0 
      ? state.project.rawVideoFiles 
      : [
          { name: 'video1.mp4', size: 1000000, type: 'video/mp4', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
          { name: 'video2.mp4', size: 2000000, type: 'video/mp4', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
          { name: 'video3.mp4', size: 1500000, type: 'video/mp4', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
        ];
    
    // Create video sources map
    const sources: Record<string, string> = {};
    videoFiles.forEach((file, index) => {
      sources[`video_${index + 1}`] = file.url;
    });
    
    setVideoSources(sources);
    
    // Add some clips
    sampleEdl.clips = [
      {
        id: 'clip_1',
        sourceId: 'video_1',
        trackType: TrackType.VIDEO,
        trackNumber: 1,
        timelineInPoint: 0,
        timelineOutPoint: 5,
        sourceInPoint: 10,
        sourceOutPoint: 15,
        enabled: true
      },
      {
        id: 'clip_2',
        sourceId: 'video_2',
        trackType: TrackType.VIDEO,
        trackNumber: 1,
        timelineInPoint: 5,
        timelineOutPoint: 10,
        sourceInPoint: 5,
        sourceOutPoint: 10,
        enabled: true
      },
      {
        id: 'clip_3',
        sourceId: 'video_3',
        trackType: TrackType.VIDEO,
        trackNumber: 1,
        timelineInPoint: 10,
        timelineOutPoint: 15,
        sourceInPoint: 0,
        sourceOutPoint: 5,
        enabled: true
      }
    ];
    
    // Add some transitions
    sampleEdl.transitions = [
      {
        id: 'transition_1',
        type: TransitionType.DISSOLVE,
        duration: 1,
        outgoingClipId: 'clip_1',
        incomingClipId: 'clip_2',
        centerPoint: 5
      },
      {
        id: 'transition_2',
        type: TransitionType.WIPE,
        duration: 1,
        outgoingClipId: 'clip_2',
        incomingClipId: 'clip_3',
        centerPoint: 10
      }
    ];
    
    // Add some cut points
    sampleEdl.cutPoints = [
      {
        id: 'cut_1',
        type: MarkerType.MARKER,
        position: 2.5,
        label: 'Beat 1'
      },
      {
        id: 'cut_2',
        type: MarkerType.MARKER,
        position: 7.5,
        label: 'Beat 2'
      },
      {
        id: 'cut_3',
        type: MarkerType.MARKER,
        position: 12.5,
        label: 'Beat 3'
      }
    ];
    
    // Set the total duration
    sampleEdl.totalDuration = 15;
    
    // Set the EDL
    setEdl(sampleEdl);
  }, [state.project.rawVideoFiles]);
  
  // Handle time update
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  // Handle playback end
  const handlePlaybackEnd = () => {
    setIsPlaying(false);
  };
  
  // Handle marker click
  const handleMarkerClick = (marker: any) => {
    console.log('Marker clicked:', marker);
  };
  
  // Handle back to editing
  const handleBackToEdit = () => {
    navigation.goToStep('edit');
  };
  
  // Handle export
  const handleExport = () => {
    navigation.goToStep('export');
  };
  
  return (
    <div className="flex-grow flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Preview</h1>
        <p className="mb-4">Preview your video with frame-accurate playback, visual markers, and synchronized waveform display.</p>
        
        {edl ? (
          <div className="preview-container">
            <PreviewWrapper
              edl={edl}
              videoSources={videoSources}
              audioSrc={state.project.musicFile?.url || 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg'}
              width={800}
              height={450}
              showWaveform={true}
              showTransitions={true}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handlePlaybackEnd}
              onMarkerClick={handleMarkerClick}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Loading preview...</p>
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <button 
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center"
            onClick={handleBackToEdit}
          >
            <Edit size={16} className="mr-2" />
            Back to Editor
          </button>
          
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            onClick={handleExport}
          >
            <FileUp size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewStep;