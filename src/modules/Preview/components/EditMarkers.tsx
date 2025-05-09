
import React from 'react';
import { EditDecisionList, MatchedClip, Transition, MarkerType } from '../../../types/EditDecision';

interface EditMarkersProps {
  /** Edit decision list containing markers, clips, and transitions */
  editDecisionList: EditDecisionList;
  /** Current playback time in seconds */
  currentTime: number;
  /** Callback when a clip is clicked */
  onClipClick?: (clip: MatchedClip) => void;
  /** Callback when a transition is clicked */
  onTransitionClick?: (transition: Transition) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Component for displaying edit markers on the timeline
 */
const EditMarkers: React.FC<EditMarkersProps> = ({
  editDecisionList,
  currentTime,
  onClipClick,
  onTransitionClick,
  className = '',
}) => {
  // Format time as MM:SS.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };
  
  // Render cut points
  const renderCutPoints = () => {
    return editDecisionList.cutPoints.map((cutPoint) => {
      const time = Number(cutPoint.position);
      const isActive = Math.abs(currentTime - time) < 0.1;
      
      return (
        <div
          key={cutPoint.id}
          className={`edit-marker cut-point ${isActive ? 'active' : ''}`}
          style={{
            backgroundColor: cutPoint.color || '#ff0000',
          }}
          title={cutPoint.label || `Cut point at ${formatTime(time)}`}
        >
          <div className="marker-time">{formatTime(time)}</div>
          <div className="marker-label">{cutPoint.label || 'Cut'}</div>
          <div className="marker-type">{cutPoint.type}</div>
        </div>
      );
    });
  };
  
  // Render clips
  const renderClips = () => {
    return editDecisionList.clips.map((clip) => {
      const inTime = Number(clip.timelineInPoint);
      const outTime = Number(clip.timelineOutPoint);
      const isActive = currentTime >= inTime && currentTime < outTime;
      
      return (
        <div
          key={clip.id}
          className={`edit-marker clip ${isActive ? 'active' : ''}`}
          onClick={() => onClipClick?.(clip)}
          title={`Clip from ${formatTime(inTime)} to ${formatTime(outTime)}`}
        >
          <div className="marker-time">{formatTime(inTime)} - {formatTime(outTime)}</div>
          <div className="marker-label">Clip {clip.id.slice(0, 6)}</div>
          <div className="marker-source">Source: {clip.sourceId}</div>
        </div>
      );
    });
  };
  
  // Render transitions
  const renderTransitions = () => {
    return editDecisionList.transitions.map((transition) => {
      const centerTime = Number(transition.centerPoint);
      const halfDuration = Number(transition.duration) / 2;
      const startTime = centerTime - halfDuration;
      const endTime = centerTime + halfDuration;
      const isActive = currentTime >= startTime && currentTime <= endTime;
      
      return (
        <div
          key={transition.id}
          className={`edit-marker transition ${isActive ? 'active' : ''}`}
          onClick={() => onTransitionClick?.(transition)}
          title={`${transition.type} transition at ${formatTime(centerTime)}`}
        >
          <div className="marker-time">{formatTime(centerTime)}</div>
          <div className="marker-label">{transition.type}</div>
          <div className="marker-duration">{formatTime(Number(transition.duration))}</div>
        </div>
      );
    });
  };
  
  return (
    <div className={`edit-markers ${className}`}>
      <div className="markers-section">
        <h4>Cut Points</h4>
        <div className="markers-list">{renderCutPoints()}</div>
      </div>
      
      <div className="markers-section">
        <h4>Clips</h4>
        <div className="markers-list">{renderClips()}</div>
      </div>
      
      <div className="markers-section">
        <h4>Transitions</h4>
        <div className="markers-list">{renderTransitions()}</div>
      </div>
    </div>
  );
};

export default EditMarkers;
