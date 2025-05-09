/**
 * BeatAnalysisDisplay Component
 * 
 * A React component for displaying beat detection results and tempo information.
 */

import React from 'react';
import { BeatAnalysis, Tempo } from '../../../types/AudioAnalysis';

interface BeatAnalysisDisplayProps {
  /** Beat analysis data */
  beatAnalysis?: BeatAnalysis;
  /** Tempo information */
  tempo?: Tempo;
  /** Show detailed beat information */
  showDetails?: boolean;
  /** Maximum number of beats to display in detail view */
  maxDetailBeats?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * BeatAnalysisDisplay component
 */
const BeatAnalysisDisplay: React.FC<BeatAnalysisDisplayProps> = ({
  beatAnalysis,
  tempo,
  showDetails = false,
  maxDetailBeats = 10,
  className = '',
}) => {
  // If no data is provided, show a placeholder
  if (!beatAnalysis && !tempo) {
    return (
      <div className={`beat-analysis-placeholder ${className}`}>
        <p className="text-gray-500 italic">No beat analysis data available</p>
      </div>
    );
  }
  
  // Calculate beat statistics if available
  const beatCount = beatAnalysis?.beats?.length || 0;
  const averageConfidence = beatAnalysis?.averageConfidence || 0;
  
  // Format confidence as percentage
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Format time in MM:SS.ms format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  
  return (
    <div className={`beat-analysis-display ${className}`}>
      {/* Tempo information */}
      {tempo && (
        <div className="tempo-info p-4 bg-blue-50 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Tempo Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">BPM</p>
              <p className="text-2xl font-bold">{tempo.bpm}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Time Signature</p>
              <p className="text-2xl font-bold">{tempo.timeSignature.numerator}/{tempo.timeSignature.denominator}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="text-lg">{formatConfidence(tempo.confidence)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Stability</p>
              <p className="text-lg">{tempo.isStable ? 'Stable' : 'Variable'}</p>
            </div>
          </div>
          
          {/* Tempo variations if available */}
          {tempo.variations && tempo.variations.length > 0 && (
            <div className="tempo-variations mt-4">
              <h4 className="text-md font-semibold mb-2">Tempo Variations</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">BPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempo.variations.map((variation, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                        <td className="p-2">{formatTime(variation.startTime)}</td>
                        <td className="p-2">{variation.bpm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Beat analysis information */}
      {beatAnalysis && (
        <div className="beat-analysis p-4 bg-indigo-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Beat Analysis</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Beats</p>
              <p className="text-2xl font-bold">{beatCount}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Average Confidence</p>
              <p className="text-2xl font-bold">{formatConfidence(averageConfidence)}</p>
            </div>
          </div>
          
          {/* Beat visualization */}
          <div className="beat-visualization mb-4 h-8 bg-white rounded relative overflow-hidden">
            {beatAnalysis.beats.map((beat, index) => (
              <div
                key={index}
                className="absolute bottom-0 bg-indigo-500"
                style={{
                  left: `${(beat.time / (beatAnalysis.beats[beatCount - 1]?.time || 1)) * 100}%`,
                  width: '2px',
                  height: beat.confidence ? `${beat.confidence * 100}%` : '50%',
                  minHeight: '4px'
                }}
                title={`Beat at ${formatTime(beat.time)} (${formatConfidence(beat.confidence || 0)})`}
              />
            ))}
          </div>
          
          {/* Detailed beat information */}
          {showDetails && beatAnalysis.beats.length > 0 && (
            <div className="beat-details mt-4">
              <h4 className="text-md font-semibold mb-2">Beat Details</h4>
              <div className="overflow-y-auto max-h-60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-100">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beatAnalysis.beats.slice(0, maxDetailBeats).map((beat, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}>
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{formatTime(beat.time)}</td>
                        <td className="p-2">{formatConfidence(beat.confidence || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {beatCount > maxDetailBeats && (
                  <p className="text-center text-gray-500 mt-2">
                    Showing {maxDetailBeats} of {beatCount} beats
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BeatAnalysisDisplay;
