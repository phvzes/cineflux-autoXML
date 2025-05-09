import React, { useState, useEffect } from 'react';
import { PreviewModule } from '../modules/Preview';
import { createEmptyEDL, EditDecisionList, MatchedClip, Transition, TransitionType, TrackType, MarkerType } from '../types/EditDecision';
import { v4 as uuidv4 } from 'uuid';
import '../modules/Preview/styles.css';
import './PreviewModuleDemo.css';

/**
 * Demo page for the Preview Module
 */
const PreviewModuleDemo: React.FC = () => {
  const [editDecisionList, setEditDecisionList] = useState<EditDecisionList | null>(null);
  const [selectedClip, setSelectedClip] = useState<MatchedClip | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<Transition | null>(null);
  
  // Create a sample EDL for demonstration
  useEffect(() => {
    const sampleEDL = createSampleEDL();
    setEditDecisionList(sampleEDL);
  }, []);
  
  // Handle clip selection
  const handleClipSelect = (clip: MatchedClip) => {
    setSelectedClip(clip);
    setSelectedTransition(null);
  };
  
  // Handle transition selection
  const handleTransitionSelect = (transition: Transition) => {
    setSelectedTransition(transition);
    setSelectedClip(null);
  };
  
  if (!editDecisionList) {
    return <div className="loading">Loading Preview Module...</div>;
  }
  
  return (
    <div className="preview-module-demo">
      <h1>Preview Module Demo</h1>
      
      <div className="preview-container">
        <PreviewModule
          editDecisionList={editDecisionList}
          audioUrl="/sample-audio.mp3"
          onClipSelect={handleClipSelect}
          onTransitionSelect={handleTransitionSelect}
        />
      </div>
      
      <div className="info-panel">
        <h2>Edit Decision Information</h2>
        
        {selectedClip && (
          <div className="selected-item">
            <h3>Selected Clip</h3>
            <table>
              <tbody>
                <tr>
                  <td>ID:</td>
                  <td>{selectedClip.id}</td>
                </tr>
                <tr>
                  <td>Source:</td>
                  <td>{selectedClip.sourceId}</td>
                </tr>
                <tr>
                  <td>Timeline In:</td>
                  <td>{selectedClip.timelineInPoint}</td>
                </tr>
                <tr>
                  <td>Timeline Out:</td>
                  <td>{selectedClip.timelineOutPoint}</td>
                </tr>
                <tr>
                  <td>Source In:</td>
                  <td>{selectedClip.sourceInPoint}</td>
                </tr>
                <tr>
                  <td>Source Out:</td>
                  <td>{selectedClip.sourceOutPoint}</td>
                </tr>
                <tr>
                  <td>Track:</td>
                  <td>{selectedClip.trackType} {selectedClip.trackNumber}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {selectedTransition && (
          <div className="selected-item">
            <h3>Selected Transition</h3>
            <table>
              <tbody>
                <tr>
                  <td>ID:</td>
                  <td>{selectedTransition.id}</td>
                </tr>
                <tr>
                  <td>Type:</td>
                  <td>{selectedTransition.type}</td>
                </tr>
                <tr>
                  <td>Duration:</td>
                  <td>{selectedTransition.duration}s</td>
                </tr>
                <tr>
                  <td>Center Point:</td>
                  <td>{selectedTransition.centerPoint}s</td>
                </tr>
                <tr>
                  <td>Outgoing Clip:</td>
                  <td>{selectedTransition.outgoingClipId}</td>
                </tr>
                <tr>
                  <td>Incoming Clip:</td>
                  <td>{selectedTransition.incomingClipId}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {!selectedClip && !selectedTransition && (
          <div className="instructions">
            <p>Click on a clip or transition in the timeline to view its details.</p>
            <p>Use the playback controls to navigate through the edit decision list.</p>
            <p>The timeline scrubber allows frame-accurate navigation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Create a sample Edit Decision List for demonstration
 */
function createSampleEDL(): EditDecisionList {
  const edl = createEmptyEDL('Sample Project', 24);
  
  // Add cut points
  edl.cutPoints = [
    {
      id: uuidv4(),
      type: MarkerType.IN,
      position: 0,
      label: 'Start',
      color: '#4CAF50',
    },
    {
      id: uuidv4(),
      type: MarkerType.MARKER,
      position: 5,
      label: 'Scene 1',
      color: '#2196F3',
    },
    {
      id: uuidv4(),
      type: MarkerType.MARKER,
      position: 10,
      label: 'Scene 2',
      color: '#2196F3',
    },
    {
      id: uuidv4(),
      type: MarkerType.MARKER,
      position: 15,
      label: 'Scene 3',
      color: '#2196F3',
    },
    {
      id: uuidv4(),
      type: MarkerType.OUT,
      position: 20,
      label: 'End',
      color: '#F44336',
    },
  ];
  
  // Add clips
  edl.clips = [
    {
      id: uuidv4(),
      sourceId: 'video1.mp4',
      trackType: TrackType.VIDEO,
      trackNumber: 1,
      timelineInPoint: 0,
      timelineOutPoint: 5,
      sourceInPoint: 10,
      sourceOutPoint: 15,
      speed: 1.0,
      enabled: true,
    },
    {
      id: uuidv4(),
      sourceId: 'video2.mp4',
      trackType: TrackType.VIDEO,
      trackNumber: 1,
      timelineInPoint: 5,
      timelineOutPoint: 10,
      sourceInPoint: 5,
      sourceOutPoint: 10,
      speed: 1.0,
      enabled: true,
    },
    {
      id: uuidv4(),
      sourceId: 'video3.mp4',
      trackType: TrackType.VIDEO,
      trackNumber: 1,
      timelineInPoint: 10,
      timelineOutPoint: 15,
      sourceInPoint: 0,
      sourceOutPoint: 5,
      speed: 1.0,
      enabled: true,
    },
    {
      id: uuidv4(),
      sourceId: 'video4.mp4',
      trackType: TrackType.VIDEO,
      trackNumber: 1,
      timelineInPoint: 15,
      timelineOutPoint: 20,
      sourceInPoint: 20,
      sourceOutPoint: 25,
      speed: 1.0,
      enabled: true,
    },
  ];
  
  // Add transitions
  edl.transitions = [
    {
      id: uuidv4(),
      type: TransitionType.CUT,
      duration: 0,
      outgoingClipId: edl.clips[0].id,
      incomingClipId: edl.clips[1].id,
      centerPoint: 5,
    },
    {
      id: uuidv4(),
      type: TransitionType.DISSOLVE,
      duration: 1,
      outgoingClipId: edl.clips[1].id,
      incomingClipId: edl.clips[2].id,
      centerPoint: 10,
    },
    {
      id: uuidv4(),
      type: TransitionType.WIPE,
      duration: 0.5,
      outgoingClipId: edl.clips[2].id,
      incomingClipId: edl.clips[3].id,
      centerPoint: 15,
      parameters: {
        direction: 'left',
      },
    },
  ];
  
  // Set total duration
  edl.totalDuration = 20;
  
  return edl;
}

export default PreviewModuleDemo;
