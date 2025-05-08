// src/pages/EditDecisionDemo.tsx
import React, { useState, useEffect } from 'react';
import { 
  EditDecisionEngine, 
  EditDecisionEngineConfig, 
  EditDecisionResult 
} from '../engine/EditDecisionEngine';
import { 
  EditDecisionVisualizer, 
  EditPreview, 
  EditDecisionControls 
} from '../components/edit-decision';
import { AudioAnalysis } from '../types/AudioAnalysis';
import { VideoAnalysisResult } from '../types/VideoAnalysis';
import AudioService from '../services/AudioService';
import VideoService from '../services/VideoService';

/**
 * Demo page for the EditDecisionEngine
 */
const EditDecisionDemo: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [videoAnalyses, setVideoAnalyses] = useState<Record<string, VideoAnalysisResult>>({});
  const [editResult, setEditResult] = useState<EditDecisionResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EditDecisionEngineConfig>({
    beatCutPercentage: 50,
    minSceneDuration: 1.0,
    maxSceneDuration: 5.0,
    prioritizeSceneBoundaries: true,
    energyThreshold: {
      low: 0.3,
      medium: 0.6,
      high: 0.8
    },
    framerate: 30
  });
  
  // Video sources for preview
  const [videoSources, setVideoSources] = useState<Record<string, string>>({});
  
  // Initialize the engine
  const engine = new EditDecisionEngine(config);
  
  // Handle audio file selection
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFile(e.target.files[0]);
    }
  };
  
  // Handle video file selection
  const handleVideoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFiles(Array.from(e.target.files));
    }
  };
  
  // Analyze audio file
  const analyzeAudio = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const analysis = await AudioService.analyzeAudio(
        file,
        (progress, step) => console.log(`Audio analysis: ${step} (${progress}%)`)
      );
      
      setAudioAnalysis(analysis);
      return analysis;
    } catch (err) {
      setError(`Error analyzing audio: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Analyze video file
  const analyzeVideo = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const videoService = new VideoService();
      const analysis = await videoService.analyzeVideo(
        file,
        (progress, step) => console.log(`Video analysis: ${step} (${progress}%)`)
      );
      
      // Create a URL for the video file
      const videoUrl = URL.createObjectURL(file);
      
      // Update video sources
      setVideoSources(prev => ({
        ...prev,
        [file.name]: videoUrl
      }));
      
      return {
        id: file.name,
        clipMetadata: {
          title: file.name,
          duration: analysis.clip.duration * 1000, // Convert to milliseconds
          width: 1280, // Placeholder
          height: 720, // Placeholder
          frameRate: 30, // Placeholder
          filePath: videoUrl
        },
        sceneDetection: {
          id: `scenes_${file.name}`,
          scenes: analysis.scenes.map((scene, index) => ({
            id: `scene_${index}`,
            startTime: scene.start * 1000, // Convert to milliseconds
            endTime: scene.end * 1000, // Convert to milliseconds
            duration: (scene.end - scene.start) * 1000, // Convert to milliseconds
            sceneTypes: [], // Placeholder
            boundaryConfidence: 0.8 // Placeholder
          })),
          sceneCount: analysis.scenes.length,
          averageSceneDuration: analysis.scenes.reduce((sum, scene) => sum + (scene.end - scene.start), 0) * 1000 / analysis.scenes.length,
          analysisTimestamp: new Date()
        },
        analysisTimestamp: new Date(),
        analysisVersion: '1.0'
      } as VideoAnalysisResult;
    } catch (err) {
      setError(`Error analyzing video: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate edit decisions
  const generateEditDecisions = () => {
    if (!audioAnalysis || Object.keys(videoAnalyses).length === 0) {
      setError('Audio and video analyses are required to generate edit decisions');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a new engine with the current config
      const engine = new EditDecisionEngine(config);
      
      // Set the audio analysis
      engine.setAudioAnalysis(audioAnalysis);
      
      // Add video analyses
      Object.entries(videoAnalyses).forEach(([id, analysis]) => {
        engine.addVideoAnalysis(id, analysis);
      });
      
      // Generate edit decisions
      const result = engine.generateEditDecisions();
      
      setEditResult(result);
    } catch (err) {
      setError(`Error generating edit decisions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle config changes
  const handleConfigChange = (newConfig: EditDecisionEngineConfig) => {
    setConfig(newConfig);
  };
  
  // Handle regenerate button click
  const handleRegenerate = () => {
    generateEditDecisions();
  };
  
  // Handle time update from preview
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  // Process files when selected
  useEffect(() => {
    const processFiles = async () => {
      // Process audio file if selected
      if (audioFile) {
        const audioResult = await analyzeAudio(audioFile);
        if (audioResult) {
          engine.setAudioAnalysis(audioResult);
        }
      }
      
      // Process video files if selected
      if (videoFiles.length > 0) {
        const videoResults: Record<string, VideoAnalysisResult> = {};
        
        for (const file of videoFiles) {
          const videoResult = await analyzeVideo(file);
          if (videoResult) {
            videoResults[file.name] = videoResult;
            engine.addVideoAnalysis(file.name, videoResult);
          }
        }
        
        setVideoAnalyses(videoResults);
      }
      
      // Generate edit decisions if both audio and video are analyzed
      if (audioFile && videoFiles.length > 0) {
        generateEditDecisions();
      }
    };
    
    processFiles();
  }, [audioFile, videoFiles]);
  
  return (
    <div className="edit-decision-demo" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Edit Decision Engine Demo</h1>
      
      <div className="file-inputs" style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <div>
          <h3>Select Audio File</h3>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioFileChange}
            disabled={isLoading}
          />
          {audioFile && (
            <div style={{ marginTop: '10px' }}>
              <strong>Selected:</strong> {audioFile.name}
            </div>
          )}
        </div>
        
        <div>
          <h3>Select Video Files</h3>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoFilesChange}
            disabled={isLoading}
          />
          {videoFiles.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Selected:</strong> {videoFiles.map(file => file.name).join(', ')}
            </div>
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="loading" style={{ textAlign: 'center', padding: '20px' }}>
          <p>Processing... Please wait.</p>
          <div className="spinner" style={{ 
            width: '40px', 
            height: '40px', 
            margin: '0 auto',
            border: '4px solid rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {error && (
        <div className="error" style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {editResult && (
        <div className="results" style={{ marginTop: '30px' }}>
          <h2>Edit Decision Results</h2>
          
          <div className="visualizer-container" style={{ marginBottom: '30px' }}>
            <h3>Timeline Visualization</h3>
            <EditDecisionVisualizer
              editDecisionResult={editResult}
              width={1000}
              height={200}
              currentTime={currentTime}
              onCutPointClick={handleTimeUpdate}
            />
          </div>
          
          <div className="preview-container" style={{ marginBottom: '30px' }}>
            <h3>Edit Preview</h3>
            <EditPreview
              edl={editResult.edl}
              videoSources={videoSources}
              width={800}
              height={450}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
          
          <div className="controls-container">
            <h3>Edit Controls</h3>
            <EditDecisionControls
              config={config}
              onChange={handleConfigChange}
              onRegenerate={handleRegenerate}
              disabled={isLoading}
            />
          </div>
          
          <div className="stats-container" style={{ 
            marginTop: '30px',
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px'
          }}>
            <h3>Edit Statistics</h3>
            <ul>
              <li><strong>Total Cuts:</strong> {editResult.stats.totalCuts}</li>
              <li><strong>Average Scene Duration:</strong> {editResult.stats.averageSceneDuration.toFixed(2)} seconds</li>
              <li><strong>Beat Alignment Score:</strong> {(editResult.stats.beatAlignmentScore * 100).toFixed(1)}%</li>
              <li>
                <strong>Transition Types:</strong>
                <ul>
                  {Object.entries(editResult.stats.transitionTypes).map(([type, count]) => (
                    <li key={type}>{type}: {count}</li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditDecisionDemo;
