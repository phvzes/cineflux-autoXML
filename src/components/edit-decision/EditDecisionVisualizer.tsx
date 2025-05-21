// src/components/edit-decision/EditDecisionVisualizer.tsx
import React, { useEffect, useRef } from 'react';
import { EditDecisionResult } from '../../engine/EditDecisionEngine';

interface EditDecisionVisualizerProps {
  /** The edit decision result to visualize */
  editDecisionResult: EditDecisionResult;
  /** Width of the visualizer in pixels */
  width?: number;
  /** Height of the visualizer in pixels */
  height?: number;
  /** Current playback position in seconds */
  currentTime?: number;
  /** Callback when a cut point is clicked */
  onCutPointClick?: (time: number) => void;
  /** Whether to show beat markers */
  showBeats?: boolean;
  /** Whether to show scene boundaries */
  showSceneBoundaries?: boolean;
  /** Whether to show energy levels */
  showEnergy?: boolean;
}

/**
 * Component for visualizing edit decisions with timeline, beats, and cuts
 */
const EditDecisionVisualizer: React.FC<EditDecisionVisualizerProps> = ({
  editDecisionResult,
  width = 800,
  height = 200,
  currentTime = 0,
  onCutPointClick,
  showBeats = true,
  showSceneBoundaries = true,
  showEnergy = true
}: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate the total duration of the edit
  const totalDuration = editDecisionResult.edl.clips.length > 0
    ? Math.max(...editDecisionResult.edl.clips.map((clip: any) => clip.timelineOutPoint as number))
    : 60; // Default to 60 seconds if no clips
  
  // Draw the visualization on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Draw timeline
    ctx.fillStyle = '#ddd';
    ctx.fillRect(0, height / 2 - 1, width, 2);
    
    // Draw time markers
    ctx.fillStyle = '#999';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= totalDuration; i += 5) {
      const x = (i / totalDuration) * width;
      ctx.fillRect(x, height / 2 - 10, 1, 20);
      ctx.fillText(`${i}s`, x, height / 2 + 20);
    }
    
    // Draw energy profile if enabled
    if (showEnergy && editDecisionResult.timeline.some((point: any) => point.energy !== undefined)) {
      ctx.beginPath();
      ctx.moveTo(0, height * 0.8);
      
      editDecisionResult.timeline
        .filter((point: any) => point.energy !== undefined)
        .forEach((point: any, index: any, array: any) => {
          const x = (point.time / totalDuration) * width;
          const y = height * 0.8 - (point.energy || 0) * (height * 0.6);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          
          // If this is the last point, extend to the end
          if (index === array.length - 1) {
            ctx.lineTo(width, y);
          }
        });
      
      ctx.lineTo(width, height * 0.8);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 128, 255, 0.2)';
      ctx.fill();
      
      // Draw energy line
      ctx.beginPath();
      editDecisionResult.timeline
        .filter((point: any) => point.energy !== undefined)
        .forEach((point: any, index: any) => {
          const x = (point.time / totalDuration) * width;
          const y = height * 0.8 - (point.energy || 0) * (height * 0.6);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
      
      ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw beats if enabled
    if (showBeats) {
      editDecisionResult.timeline
        .filter((point: any) => point.type === 'beat')
        .forEach((beat: any) => {
          const x = (beat.time / totalDuration) * width;
          
          ctx.fillStyle = 'rgba(0, 200, 0, 0.5)';
          ctx.beginPath();
          ctx.arc(x, height / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        });
    }
    
    // Draw cuts
    editDecisionResult.timeline
      .filter((point: any) => point.type === 'cut')
      .forEach((cut: any) => {
        const x = (cut.time / totalDuration) * width;
        
        // Draw cut line
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, height - 10);
        ctx.stroke();
        
        // Draw cut point
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(x, height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw source ID if available
        if (cut.sourceId) {
          ctx.fillStyle = '#333';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(cut.sourceId, x, height - 20);
        }
      });
    
    // Draw transitions
    editDecisionResult.edl.transitions.forEach((transition: any) => {
      const x = (transition.centerPoint as number / totalDuration) * width;
      
      // Draw transition marker
      ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(x, height / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw transition type
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(transition.type, x, height / 2 - 15);
    });
    
    // Draw current time indicator
    if (currentTime >= 0 && currentTime <= totalDuration) {
      const x = (currentTime / totalDuration) * width;
      
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Draw playhead
      ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 8, 10);
      ctx.lineTo(x + 8, 10);
      ctx.closePath();
      ctx.fill();
    }
    
  }, [editDecisionResult, width, height, currentTime, showBeats, showSceneBoundaries, showEnergy, totalDuration]);
  
  // Handle click on the canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCutPointClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / width) * totalDuration;
    
    // Find the nearest cut point
    const cuts = editDecisionResult.timeline.filter((point: any) => point.type === 'cut');
    if (cuts.length === 0) return;
    
    let nearestCut = cuts[0];
    let minDistance = Math.abs(nearestCut.time - clickTime);
    
    for (const cut of cuts) {
      const distance = Math.abs(cut.time - clickTime);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCut = cut;
      }
    }
    
    // Only trigger if click is close enough to a cut point (within 5% of total duration)
    if (minDistance <= totalDuration * 0.05) {
      onCutPointClick(nearestCut.time);
    }
  };
  
  return (
    <div className="edit-decision-visualizer">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="legend" style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <div style={{ marginRight: '20px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(0, 200, 0, 0.5)', marginRight: '5px' }}></span>
          Beats
        </div>
        <div style={{ marginRight: '20px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(255, 0, 0, 0.8)', marginRight: '5px' }}></span>
          Cuts
        </div>
        <div style={{ marginRight: '20px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(255, 165, 0, 0.8)', marginRight: '5px' }}></span>
          Transitions
        </div>
        <div>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(0, 128, 255, 0.2)', marginRight: '5px' }}></span>
          Energy
        </div>
      </div>
    </div>
  );
};

export default EditDecisionVisualizer;
