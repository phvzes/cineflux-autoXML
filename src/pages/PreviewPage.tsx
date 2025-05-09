
import React, { useState, useEffect } from 'react';
import { PreviewWrapper } from '../components/preview';
import { EditDecisionList, createEmptyEDL, TransitionType, MarkerType, TrackType } from '../types/EditDecision';
import { editDecisionEngine } from '../engine/EditDecisionEngine';

/**
 * Page for testing the Preview Module
 */
const PreviewPage: React.FC = () => {
  const [edl, setEdl] = useState<EditDecisionList | null>(null);
  const [videoSources, setVideoSources] = useState<Record<string, string>>({});
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Create a sample EDL for testing
  useEffect(() => {
    // Create an empty EDL
    const sampleEdl = createEmptyEDL('Test EDL', 30);
    
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
        sourceId: 'video_1',
        trackType: TrackType.VIDEO,
        trackNumber: 1,
        timelineInPoint: 10,
        timelineOutPoint: 15,
        sourceInPoint: 20,
        sourceOutPoint: 25,
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
    
    // Set up some sample video sources
    // In a real application, these would come from the project's video files
    setVideoSources({
      video_1: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      video_2: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    });
    
    // Set up a sample audio source
    // In a real application, this would come from the project's audio file
    setAudioSrc('https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg');
    
    setIsLoading(false);
  }, []);
  
  if (isLoading || !edl) {
    return <div>Loading preview...</div>;
  }
  
  return (
    <div className="preview-page">
      <h1>Preview Module</h1>
      <p>This page demonstrates the Preview Module for the CineFlux-AutoXML project.</p>
      
      <div className="preview-container">
        <PreviewWrapper
          edl={edl}
          videoSources={videoSources}
          audioSrc={audioSrc}
          width={800}
          height={450}
          showWaveform={true}
          showTransitions={true}
          onTimeUpdate={(time) => console.log('Time update:', time)}
          onEnded={() => console.log('Playback ended')}
          onMarkerClick={(marker) => console.log('Marker clicked:', marker)}
        />
      </div>
      
      <div className="preview-info">
        <h2>Preview Module Features</h2>
        <ul>
          <li>Frame-accurate playback with scrubbing capability</li>
          <li>Visual markers for edit points and transitions</li>
          <li>Synchronized waveform display</li>
          <li>Preview of transitions between clips</li>
        </ul>
      </div>
    </div>
  );
};

export default PreviewPage;
