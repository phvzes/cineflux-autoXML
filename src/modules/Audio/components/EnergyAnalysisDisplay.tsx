/**
 * EnergyAnalysisDisplay Component
 * 
 * A React component for displaying energy analysis results with visualization.
 */

import React, { useRef, useEffect } from 'react';
import { EnergyAnalysis } from '../../../types/AudioAnalysis';

interface EnergyAnalysisDisplayProps {
  /** Energy analysis data */
  energyAnalysis?: EnergyAnalysis;
  /** Width of the visualization */
  width?: number;
  /** Height of the visualization */
  height?: number;
  /** Color for the energy graph */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show detailed energy information */
  showDetails?: boolean;
  /** Current playback position in seconds */
  currentTime?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * EnergyAnalysisDisplay component
 */
const EnergyAnalysisDisplay: React.FC<EnergyAnalysisDisplayProps> = ({
  energyAnalysis,
  width = 800,
  height = 200,
  color = '#8b5cf6',
  backgroundColor = '#f5f3ff',
  showDetails = false,
  currentTime = 0,
  className = '',
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // If no data is provided, show a placeholder
  if (!energyAnalysis) {
    return (
      <div className={`energy-analysis-placeholder ${className}`}>
        <p className="text-gray-500 italic">No energy analysis data available</p>
      </div>
    );
  }
  
  /**
   * Draw the energy graph on the canvas
   */
  useEffect(() => {
    if (!canvasRef.current || !energyAnalysis || !energyAnalysis.samples.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e9d5ff';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (energy levels)
    for (let i = 0; i <= 10; i++) {
      const y = canvas.height - (i / 10) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      
      // Add labels for energy levels
      if (i % 2 === 0) {
        ctx.fillStyle = '#a78bfa';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${i * 10}%`, 5, y - 5);
      }
    }
    
    // Vertical grid lines (time)
    const samples = energyAnalysis.samples;
    const lastSampleTime = samples[samples.length - 1]?.time || 0;
    
    // Determine appropriate time interval based on duration
    let interval = 1; // seconds
    if (lastSampleTime > 120) interval = 30;
    else if (lastSampleTime > 60) interval = 10;
    else if (lastSampleTime > 30) interval = 5;
    else if (lastSampleTime > 10) interval = 2;
    
    for (let time = 0; time <= lastSampleTime; time += interval) {
      const x = (time / lastSampleTime) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      // Add time labels
      ctx.fillStyle = '#a78bfa';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      ctx.fillText(timeLabel, x, canvas.height - 5);
    }
    
    // Draw energy graph
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    samples.forEach((sample, index) => {
      const x = (sample.time / lastSampleTime) * canvas.width;
      const y = canvas.height - (sample.level * canvas.height);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Fill area under the graph
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = `${color}33`; // Add transparency to the fill color
    ctx.fill();
    
    // Draw peak energy marker
    if (energyAnalysis.peakEnergyTime !== undefined && energyAnalysis.peakEnergy !== undefined) {
      const peakX = (energyAnalysis.peakEnergyTime / lastSampleTime) * canvas.width;
      const peakY = canvas.height - (energyAnalysis.peakEnergy * canvas.height);
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Add peak label
      ctx.fillStyle = '#ef4444';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Peak', peakX, peakY - 10);
    }
    
    // Draw current time marker
    if (currentTime > 0 && currentTime <= lastSampleTime) {
      const currentX = (currentTime / lastSampleTime) * canvas.width;
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, canvas.height);
      ctx.stroke();
    }
    
  }, [energyAnalysis, width, height, color, backgroundColor, currentTime]);
  
  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format energy level as percentage
  const formatEnergy = (energy: number): string => {
    return `${Math.round(energy * 100)}%`;
  };
  
  return (
    <div className={`energy-analysis-display ${className}`}>
      <div className="energy-info p-4 bg-purple-50 rounded-lg mb-4">
        <h3 className="text-lg font-semibold mb-2">Energy Analysis</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Average Energy</p>
            <p className="text-2xl font-bold">{formatEnergy(energyAnalysis.averageEnergy)}</p>
          </div>
          
          {energyAnalysis.peakEnergy !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Peak Energy</p>
              <p className="text-2xl font-bold">{formatEnergy(energyAnalysis.peakEnergy)}</p>
            </div>
          )}
          
          {energyAnalysis.peakEnergyTime !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Peak Time</p>
              <p className="text-2xl font-bold">{formatTime(energyAnalysis.peakEnergyTime)}</p>
            </div>
          )}
        </div>
        
        {/* Energy visualization */}
        <div className="energy-visualization">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="rounded border border-purple-200"
          />
        </div>
        
        {/* Detailed energy information */}
        {showDetails && energyAnalysis.samples.length > 0 && (
          <div className="energy-details mt-4">
            <h4 className="text-md font-semibold mb-2">Energy Details</h4>
            
            <div className="overflow-y-auto max-h-60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-100">
                    <th className="p-2 text-left">Time</th>
                    <th className="p-2 text-left">Energy Level</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Show every 10th sample to avoid overwhelming the table */}
                  {energyAnalysis.samples
                    .filter((_, index) => index % 10 === 0)
                    .map((sample, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                        <td className="p-2">{formatTime(sample.time)}</td>
                        <td className="p-2">{formatEnergy(sample.level)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              <p className="text-center text-gray-500 mt-2">
                Showing {Math.ceil(energyAnalysis.samples.length / 10)} of {energyAnalysis.samples.length} samples
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnergyAnalysisDisplay;
