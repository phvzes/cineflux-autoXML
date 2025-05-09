/**
 * PreviewStep.tsx
 * 
 * This component represents the preview step in the workflow where
 * users can see a full preview of the edited video.
 */

import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { Edit, FileUp } from 'lucide-react';
import { PreviewModule } from '../../modules/Preview';
import { createEmptyEDL, EditDecisionList, MatchedClip, Transition, TransitionType, TrackType, MarkerType } from '../../types/EditDecision';
import { v4 as uuidv4 } from 'uuid';
import '../../modules/Preview/styles.css';

interface PreviewStepProps {
  audioElement?: HTMLAudioElement | null;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ audioElement }) => {
  // Get workflow context
  const { currentStep, goToStep, data, setData } = useWorkflow();
  
  // State for the edit decision list
  const [editDecisionList, setEditDecisionList] = useState<EditDecisionList | null>(null);
  const [selectedClip, setSelectedClip] = useState<MatchedClip | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<Transition | null>(null);
  
  // Create an EDL from the workflow data
  useEffect(() => {
    // Create a new EDL
    const edl = createEmptyEDL(data.project.name || 'Project', 24);
    
    // Set total duration
    edl.totalDuration = data.workflow.totalDuration || 120;
    
    // Add cut points from edit decisions
    if (data.edit.decisions && data.edit.decisions.length > 0) {
      edl.cutPoints = data.edit.decisions.map((decision, index) => ({
        id: decision.id || uuidv4(),
        type: MarkerType.MARKER,
        position: decision.time,
        label: `Edit ${index + 1}`,
        color: decision.onBeat ? '#4CAF50' : '#2196F3',
      }));
      
      // Add clips based on edit decisions
      edl.clips = data.edit.decisions.map((decision, index) => {
        // Calculate end time (either next decision time or total duration)
        const nextTime = index < data.edit.decisions.length - 1 
          ? data.edit.decisions[index + 1].time 
          : data.workflow.totalDuration;
          
        // Find video file for this decision
        const videoFile = data.project.videoFiles.find(v => v.name === decision.videoId) || 
          { name: `video${index + 1}.mp4`, duration: 30 };
        
        return {
          id: decision.id || uuidv4(),
          sourceId: videoFile.name,
          trackType: TrackType.VIDEO,
          trackNumber: 1,
          timelineInPoint: decision.time,
          timelineOutPoint: nextTime,
          sourceInPoint: decision.clipStartTime || 0,
          sourceOutPoint: (decision.clipStartTime || 0) + (nextTime - decision.time),
          speed: 1.0,
          enabled: true,
        };
      });
      
      // Add transitions between clips
      edl.transitions = [];
      for (let i = 0; i < edl.clips.length - 1; i++) {
        const outgoingClip = edl.clips[i];
        const incomingClip = edl.clips[i + 1];
        const decision = data.edit.decisions[i + 1];
        
        edl.transitions.push({
          id: uuidv4(),
          type: decision.transitionType || TransitionType.CUT,
          duration: decision.transitionType === TransitionType.CUT ? 0 : 1,
          outgoingClipId: outgoingClip.id,
          incomingClipId: incomingClip.id,
          centerPoint: incomingClip.timelineInPoint,
        });
      }
    } else {
      // Create sample data if no edit decisions exist
      createSampleEDLData(edl);
    }
    
    setEditDecisionList(edl);
  }, [data.project, data.edit.decisions, data.workflow.totalDuration]);
  
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
  
  // Handle back to editing
  const handleBackToEdit = () => {
    goToStep('editing');
  };
  
  // Handle export
  const handleExport = () => {
    goToStep('export');
  };
  
  if (!editDecisionList) {
    return <div className="flex items-center justify-center h-full">Loading Preview...</div>;
  }
  
  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex-grow overflow-hidden">
        {/* Preview Module */}
        <PreviewModule
          editDecisionList={editDecisionList}
          audioUrl={data.project.musicFile ? URL.createObjectURL(data.project.musicFile) : undefined}
          onClipSelect={handleClipSelect}
          onTransitionSelect={handleTransitionSelect}
          className="h-full"
        />
      </div>
      
      {/* Info Panel */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-start">
          {/* Selected item info */}
          <div className="flex-grow">
            {selectedClip && (
              <div className="bg-gray-700 p-3 rounded">
                <h3 className="text-lg font-medium text-white mb-2">Selected Clip</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Source:</div>
                  <div className="text-white">{selectedClip.sourceId}</div>
                  <div className="text-gray-400">Timeline Position:</div>
                  <div className="text-white">
                    {formatTime(Number(selectedClip.timelineInPoint))} - {formatTime(Number(selectedClip.timelineOutPoint))}
                  </div>
                  <div className="text-gray-400">Source Position:</div>
                  <div className="text-white">
                    {formatTime(Number(selectedClip.sourceInPoint))} - {formatTime(Number(selectedClip.sourceOutPoint))}
                  </div>
                </div>
              </div>
            )}
            
            {selectedTransition && (
              <div className="bg-gray-700 p-3 rounded">
                <h3 className="text-lg font-medium text-white mb-2">Selected Transition</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Type:</div>
                  <div className="text-white">{selectedTransition.type}</div>
                  <div className="text-gray-400">Duration:</div>
                  <div className="text-white">{selectedTransition.duration}s</div>
                  <div className="text-gray-400">Position:</div>
                  <div className="text-white">{formatTime(Number(selectedTransition.centerPoint))}</div>
                </div>
              </div>
            )}
            
            {!selectedClip && !selectedTransition && (
              <div className="text-gray-400 italic">
                Click on a clip or transition in the timeline to view details
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-4 ml-4">
            <button 
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 flex items-center"
              onClick={handleBackToEdit}
            >
              <Edit size={16} className="mr-2" />
              Back to Editor
            </button>
            
            <button 
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 flex items-center"
              onClick={handleExport}
            >
              <FileUp size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Create sample EDL data for demonstration
 */
function createSampleEDLData(edl: EditDecisionList): void {
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
}

/**
 * Format time as MM:SS.ms
 */
function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

export default PreviewStep;
