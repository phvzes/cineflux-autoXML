/**
 * Audio Analysis Module
 * 
 * Main component for the Audio Analysis Module, providing audio analysis
 * functionality including beat detection, waveform visualization, and
 * feature extraction.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AudioAnalysis } from '../../types/AudioAnalysis';
import useAudioAnalysis from './hooks/useAudioAnalysis';
import WaveformCanvas from './components/WaveformCanvas';
import WaveSurferWrapper from './components/WaveSurferWrapper';
import BeatAnalysisDisplay from './components/BeatAnalysisDisplay';
import EnergyAnalysisDisplay from './components/EnergyAnalysisDisplay';

interface AudioModuleProps {
  /** Audio file to analyze */
  audioFile?: File;
  /** Audio URL to analyze */
  audioUrl?: string;
  /** Auto-analyze on load */
  autoAnalyze?: boolean;
  /** Callback when analysis is complete */
  onAnalysisComplete?: (analysis: AudioAnalysis) => void;
  /** Use WaveSurfer.js instead of custom canvas */
  useWaveSurfer?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * AudioModule component
 */
const AudioModule: React.FC<AudioModuleProps> = ({
  audioFile,
  audioUrl,
  autoAnalyze = true,
  onAnalysisComplete,
  useWaveSurfer = true,
  className = '',
}) => {
  // State
  const [audioSource, setAudioSource] = useState<File | string | null>(audioFile || audioUrl || null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'waveform' | 'beats' | 'energy'>('waveform');
  
  // Use the audio analysis hook
  const {
    audioBuffer,
    analysis,
    isLoading,
    progress,
    error,
    loadAudio,
    analyzeAudio,
    reset
  } = useAudioAnalysis(audioSource || undefined, { autoAnalyze });
  
  // Update audio source when props change
  useEffect(() => {
    const newSource = audioFile || audioUrl || null;
    if (newSource !== audioSource) {
      setAudioSource(newSource);
      
      // Reset analysis if source changes
      if (audioSource) {
        reset();
      }
    }
  }, [audioFile, audioUrl, audioSource, reset]);
  
  // Load and analyze audio when source changes
  useEffect(() => {
    if (audioSource && !audioBuffer) {
      loadAudio(audioSource).catch(err => {
        console.error('Error loading audio:', err);
      });
    }
  }, [audioSource, audioBuffer, loadAudio]);
  
  // Notify parent when analysis is complete
  useEffect(() => {
    if (analysis && onAnalysisComplete) {
      onAnalysisComplete(analysis);
    }
  }, [analysis, onAnalysisComplete]);
  
  /**
   * Handle play/pause
   */
  const handlePlayPause = useCallback(() => {
    if (!audioBuffer) return;
    
    setIsPlaying(!isPlaying);
    
    // Create audio context and play the buffer
    if (!isPlaying) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0, currentTime);
      
      // Update current time
      let startTime = audioContext.currentTime;
      const interval = setInterval(() => {
        const elapsed = audioContext.currentTime - startTime;
        setCurrentTime(currentTime + elapsed);
        
        if (currentTime + elapsed >= audioBuffer.duration) {
          clearInterval(interval);
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }, 100);
      
      // Clean up on stop
      source.onended = () => {
        clearInterval(interval);
        setIsPlaying(false);
      };
      
      return () => {
        source.stop();
        clearInterval(interval);
      };
    }
  }, [audioBuffer, isPlaying, currentTime]);
  
  /**
   * Handle position change
   */
  const handlePositionChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);
  
  /**
   * Start analysis manually
   */
  const handleStartAnalysis = useCallback(() => {
    if (!audioBuffer) return;
    
    analyzeAudio().catch(err => {
      console.error('Error analyzing audio:', err);
    });
  }, [audioBuffer, analyzeAudio]);
  
  // Format progress as percentage
  const formatProgress = (progress: number): string => {
    return `${Math.round(progress * 100)}%`;
  };
  
  return (
    <div className={`audio-module p-4 ${className}`}>
      <h2 className="text-2xl font-bold mb-4">Audio Analysis</h2>
      
      {/* Status and controls */}
      <div className="status-bar mb-4 p-3 bg-gray-100 rounded-lg flex justify-between items-center">
        <div className="status">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-blue-500 rounded-full"></div>
              <span>Analyzing... {formatProgress(progress)}</span>
            </div>
          ) : analysis ? (
            <span className="text-green-600">Analysis complete</span>
          ) : audioBuffer ? (
            <span className="text-blue-600">Audio loaded, ready for analysis</span>
          ) : audioSource ? (
            <span className="text-yellow-600">Loading audio...</span>
          ) : (
            <span className="text-gray-600">No audio source selected</span>
          )}
        </div>
        
        <div className="controls flex gap-2">
          {audioBuffer && !analysis && !isLoading && (
            <button
              onClick={handleStartAnalysis}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Analyze Audio
            </button>
          )}
          
          {audioBuffer && (
            <button
              onClick={handlePlayPause}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={isLoading}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Tabs */}
      <div className="tabs mb-4">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${activeTab === 'waveform' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('waveform')}
          >
            Waveform
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'beats' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('beats')}
          >
            Beats & Tempo
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'energy' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('energy')}
          >
            Energy Analysis
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {/* Waveform tab */}
        {activeTab === 'waveform' && (
          <div className="waveform-tab">
            {useWaveSurfer ? (
              <WaveSurferWrapper
                audioSrc={audioSource}
                showTimeline={true}
                showRegions={!!analysis?.sections}
                showBeats={!!analysis?.beats}
                beats={analysis?.beats?.beats}
                sections={analysis?.sections?.sections}
                onPositionChange={handlePositionChange}
                className="mb-4"
              />
            ) : (
              <WaveformCanvas
                waveform={analysis?.waveform || null}
                currentTime={currentTime}
                duration={audioBuffer?.duration}
                width={800}
                height={200}
                showBeats={!!analysis?.beats}
                beats={analysis?.beats?.beats}
                onPositionClick={handlePositionChange}
                className="mb-4"
              />
            )}
            
            {analysis?.sections?.sections && (
              <div className="sections-info mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Audio Sections</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-2 text-left">Label</th>
                        <th className="p-2 text-left">Start</th>
                        <th className="p-2 text-left">Duration</th>
                        <th className="p-2 text-left">Energy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.sections.sections.map((section, index) => {
                        // Format time in MM:SS format
                        const formatTime = (seconds: number): string => {
                          const minutes = Math.floor(seconds / 60);
                          const secs = Math.floor(seconds % 60);
                          return `${minutes}:${secs.toString().padStart(2, '0')}`;
                        };
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                            <td className="p-2 capitalize">{section.label}</td>
                            <td className="p-2">{formatTime(section.start)}</td>
                            <td className="p-2">{formatTime(section.duration)}</td>
                            <td className="p-2">
                              {section.characteristics?.energy !== undefined
                                ? `${Math.round(section.characteristics.energy * 100)}%`
                                : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Beats tab */}
        {activeTab === 'beats' && (
          <div className="beats-tab">
            <BeatAnalysisDisplay
              beatAnalysis={analysis?.beats}
              tempo={analysis?.tempo}
              showDetails={true}
              maxDetailBeats={20}
              className="mb-4"
            />
          </div>
        )}
        
        {/* Energy tab */}
        {activeTab === 'energy' && (
          <div className="energy-tab">
            <EnergyAnalysisDisplay
              energyAnalysis={analysis?.energy}
              width={800}
              height={200}
              showDetails={true}
              currentTime={currentTime}
              className="mb-4"
            />
          </div>
        )}
      </div>
      
      {/* Analysis summary */}
      {analysis && (
        <div className="analysis-summary mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Analysis Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-bold">
                {Math.floor(analysis.metadata.duration / 60)}:
                {Math.floor(analysis.metadata.duration % 60).toString().padStart(2, '0')}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Tempo</p>
              <p className="text-lg font-bold">{analysis.tempo?.bpm || 'N/A'} BPM</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Beats</p>
              <p className="text-lg font-bold">{analysis.beats?.beats.length || 0}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Sections</p>
              <p className="text-lg font-bold">{analysis.sections?.sections.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioModule;
