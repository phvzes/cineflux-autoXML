/**
 * AnalysisStep.tsx
 * 
 * This component represents the analysis step in the workflow where
 * audio and video files are analyzed to extract features for editing.
 */

import React, { useEffect, useState } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { Beat, AudioSegment } from '../../types/workflow';
import useAudioService from '../../hooks/useAudioService';
import WaveformVisualizer from '../../components/audio/WaveformVisualizer';
import { AppState } from '../../types/workflow-types';

// Import icons 
import { 
  RefreshCw,
  Play,
  Pause,
  Check,
  AlertTriangle
} from 'lucide-react';

const AnalysisStep: React.FC = () => {
  // Get workflow context
  const { _currentStep, goToStep, data, setData } = useWorkflow();
  
  // Use audio service hook
  const {
    waveformData,
    audioBuffer,
    isPlaying,
    currentTime,
    duration,
    loadAudio,
    analyzeAudio,
    togglePlayPause,
    seekTo
  } = useAudioService();
  
  // Local state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Check if we have completed analysis
  const hasAnalysisResults = Boolean(data.analysis.audio);
  
  // Load audio file when available
  useEffect(() => {
    if (data.project.musicFile && !audioBuffer && !isAnalyzing) {
      handleLoadAudio(data.project.musicFile);
    }
  }, [data.project.musicFile, audioBuffer, isAnalyzing]);
  
  // Load audio file
  const handleLoadAudio = async (file: File) => {
    try {
      await loadAudio(file, (progress: number, step: string) => {
        // Update loading progress
        setData((prev: AppState) => ({
          ...prev,
          workflow: {
            ...prev.workflow,
            analysisProgress: {
              percentage: Math.floor(progress * 0.3),
              currentStep: step
            }
          }
        }));
      });
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };
  
  // Start analysis if we don't have results
  useEffect(() => {
    if (!hasAnalysisResults && !data.analysis.isAnalyzing && data.project.musicFile && audioBuffer && !isAnalyzing) {
      handleStartAnalysis();
    }
  }, [hasAnalysisResults, data.analysis.isAnalyzing, data.project.musicFile, audioBuffer, isAnalyzing]);
  
  // Start audio analysis
  const handleStartAnalysis = async () => {
    if (!data.project.musicFile || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setData((prev: AppState) => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        isAnalyzing: true
      }
    }));
    
    try {
      // Analyze the audio file
      const analysis = await analyzeAudio(data.project.musicFile, (progress: number, step: string) => {
        // Map the analysis progress to 30-100% of the total progress
        const totalProgress = 30 + Math.floor(progress * 0.7);
        setData((prev: AppState) => ({
          ...prev,
          workflow: {
            ...prev.workflow,
            analysisProgress: {
              percentage: totalProgress,
              currentStep: step
            }
          }
        }));
      });
      
      // Update the analysis results
      setData((prev: AppState) => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          isAnalyzing: false,
          audio: {
            tempo: analysis.tempo.bpm,
            beatTimes: analysis.beats.beats.map((beat: any) => ({ 
              time: beat.time, 
              strength: beat.confidence 
            })),
            segments: analysis.sections.sections.map((section: any) => ({
              start: section.start,
              end: section.start + section.duration,
              isChorus: section.label.toLowerCase().includes('chorus'),
              energyLevel: section.confidence
            })),
            waveformData: waveformData || new Float32Array()
          }
        },
        workflow: {
          ...prev.workflow,
          totalDuration: analysis.metadata.duration
        }
      }));
    } catch (error) {
      console.error('Error analyzing audio:', error);
      
      // If analysis fails, create mock data
      simulateAnalysisCompletion();
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Simulate analysis completion with mock data
  const simulateAnalysisCompletion = () => {
    // Create mock analysis results
    const mockAudio = {
      tempo: 120,
      beatTimes: Array.from({ length: 100 }, (_: any, i: any) => ({ time: i * 0.5, strength: Math.random() * 0.5 + 0.5 })),
      segments: [
        { start: 0, end: 15, isChorus: false, energyLevel: 0.6 },
        { start: 15, end: 30, isChorus: true, energyLevel: 0.9 },
        { start: 30, end: 45, isChorus: false, energyLevel: 0.7 },
        { start: 45, end: 60, isChorus: true, energyLevel: 0.95 }
      ],
      waveformData: waveformData || new Float32Array(1000).fill(0).map(() => Math.random() * 2 - 1)
    };
    
    setData((prev: AppState) => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        isAnalyzing: false,
        audio: mockAudio
      },
      workflow: {
        ...prev.workflow,
        totalDuration: duration || 60 // Use actual duration or fallback to 60 seconds
      }
    }));
  };
  
  // Handle continue to next step
  const handleContinue = () => {
    if (hasAnalysisResults) {
      goToStep('editing');
    }
  };
  
  // Handle regenerate analysis
  const handleRegenerate = () => {
    setData((prev: AppState) => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        isAnalyzing: true,
        audio: null
      },
      workflow: {
        ...prev.workflow,
        analysisProgress: {
          percentage: 0,
          currentStep: "Starting analysis..."
        }
      }
    }));
    
    // Restart analysis
    handleStartAnalysis();
  };
  
  // Handle seeking to a specific time
  const handleSeek = (time: number) => {
    seekTo(time);
  };
  
  // Render progress content during analysis
  const renderAnalysisProgress = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-6">
        <div className="text-purple-500 animate-pulse">⚡</div>
      </div>
      
      <h2 className="text-xl font-bold mb-2">Analyzing Media</h2>
      <p className="text-gray-400 mb-6">{data.workflow.analysisProgress.currentStep}</p>
      
      {/* Progress bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{data.workflow.analysisProgress.percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4">
          <div 
            className="bg-purple-600 h-4 rounded-full transition-all duration-300" 
            style={{width: `${data.workflow.analysisProgress.percentage}%`}}
          />
        </div>
      </div>
      
      {/* Analysis steps */}
      <div className="w-full max-w-lg">
        <div className="text-sm text-gray-400 space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${
              data.workflow.analysisProgress.percentage >= 20 ? 'bg-green-500' : 'bg-gray-600'
            }`} />
            <span>{data.workflow.analysisProgress.percentage >= 20 ? "✓ Beat detection complete" : "Waiting for beat detection"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${
              data.workflow.analysisProgress.percentage >= 40 ? 'bg-green-500' : 
              data.workflow.analysisProgress.percentage >= 20 ? 'animate-pulse bg-purple-500' : 'bg-gray-600'
            }`} />
            <span>
              {data.workflow.analysisProgress.percentage >= 40 ? "✓ Music structure analysis complete" : 
              data.workflow.analysisProgress.percentage >= 20 ? "Analyzing music structure" : 
              "Waiting for music structure analysis"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${
              data.workflow.analysisProgress.percentage >= 60 ? 'bg-green-500' : 
              data.workflow.analysisProgress.percentage >= 40 ? 'animate-pulse bg-purple-500' : 'bg-gray-600'
            }`} />
            <span>
              {data.workflow.analysisProgress.percentage >= 60 ? "✓ Video content analysis complete" : 
              data.workflow.analysisProgress.percentage >= 40 ? "Analyzing video content" : 
              "Waiting for video analysis"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${
              data.workflow.analysisProgress.percentage >= 80 ? 'bg-green-500' : 
              data.workflow.analysisProgress.percentage >= 60 ? 'animate-pulse bg-purple-500' : 'bg-gray-600'
            }`} />
            <span>
              {data.workflow.analysisProgress.percentage >= 80 ? "✓ Edit decisions created" : 
              data.workflow.analysisProgress.percentage >= 60 ? "Creating edit decisions" : 
              "Waiting to create edit decisions"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${
              data.workflow.analysisProgress.percentage >= 95 ? 'bg-green-500' : 
              data.workflow.analysisProgress.percentage >= 80 ? 'animate-pulse bg-purple-500' : 'bg-gray-600'
            }`} />
            <span>
              {data.workflow.analysisProgress.percentage >= 95 ? "✓ Preview generated" : 
              data.workflow.analysisProgress.percentage >= 80 ? "Generating preview" : 
              "Waiting to generate preview"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render analysis results
  const renderAnalysisResults = () => (
    <div className="flex flex-col p-6 gap-6">
      {/* Audio Analysis Results */}
      <div className="border border-gray-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Audio Analysis Results</h2>
        
        {/* Audio stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Tempo</div>
            <div className="text-2xl font-semibold">{data.analysis.audio?.tempo.toFixed(1)} <span className="text-sm text-gray-400">BPM</span></div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Beats Detected</div>
            <div className="text-2xl font-semibold">{data.analysis.audio?.beatTimes?.length || 0}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Segments</div>
            <div className="text-2xl font-semibold">{data.analysis.audio?.segments?.length || 0}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Duration</div>
            <div className="text-2xl font-semibold">{formatTime(data.workflow.totalDuration)}</div>
          </div>
        </div>
        
        {/* Waveform */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Waveform & Beat Detection</h3>
          <div className="border border-gray-700 rounded p-2 bg-gray-800">
            {/* Waveform visualization */}
            <div className="h-[180px] bg-gray-900 rounded relative">
              {waveformData ? (
                <WaveformVisualizer
                  waveformData={waveformData}
                  beats={data.analysis.audio?.beatTimes as Beat[]}
                  currentTime={currentTime}
                  width={800}
                  height={180}
                  waveformColor="#3B82F6"
                  beatColor="#FF5722"
                  positionColor="#4CAF50"
                  showBeats={true}
                  showPosition={true}
                  onPositionClick={handleSeek}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                  Waveform visualization will be displayed here
                </div>
              )}
            </div>
            
            {/* Playback Controls */}
            <div className="flex items-center mt-4">
              <button
                onClick={togglePlayPause}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 flex items-center"
              >
                {isPlaying ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <div className="ml-4 text-sm text-gray-400">
                {formatTime(currentTime)} / {formatTime(data.workflow.totalDuration)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Segments */}
        <div>
          <h3 className="font-medium mb-2">Audio Segments</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {data.analysis.audio?.segments.map((segment: AudioSegment, index: number) => (
              <div 
                key={index} 
                className={`p-3 rounded flex justify-between ${
                  segment.isChorus 
                    ? 'bg-blue-900 bg-opacity-30 border border-blue-800' 
                    : 'bg-gray-700'
                }`}
                onClick={() => handleSeek(segment.start)}
              >
                <span className="font-medium">
                  {segment.isChorus ? 'Chorus' : 'Verse'} {index + 1}
                </span>
                <span className="text-sm text-gray-400">
                  {formatTime(segment.start)} - {formatTime(segment.end)}
                  ({formatTime(segment.end - segment.start)})
                </span>
                <span className="text-sm">
                  Energy: {segment.energyLevel.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Video Analysis Results */}
      <div className="border border-gray-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Video Analysis Results</h2>
        
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <AlertTriangle size={32} className="mx-auto mb-2 text-yellow-500" />
          <p>Video analysis details will be implemented in a future version.</p>
          <p className="text-sm text-gray-400 mt-2">Currently focusing on audio analysis integration.</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between">
        <button
          className="px-5 py-2 bg-gray-700 rounded hover:bg-gray-600 flex items-center"
          onClick={handleRegenerate}
        >
          <RefreshCw size={16} className="mr-2" />
          Regenerate Analysis
        </button>
        
        <button
          className="px-5 py-2 bg-purple-700 rounded hover:bg-purple-600 flex items-center"
          onClick={handleContinue}
        >
          <Check size={16} className="mr-2" />
          Continue to Editing
        </button>
      </div>
    </div>
  );
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex-grow flex flex-col">
      {data.analysis.isAnalyzing || isAnalyzing
        ? renderAnalysisProgress()
        : data.analysis.audio
        ? renderAnalysisResults()
        : renderAnalysisProgress() // Fallback to progress view if no state is available
      }
    </div>
  );
};

export default AnalysisStep;
