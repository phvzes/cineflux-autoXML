/**
 * VideoAnalyzer.tsx
 * 
 * Component for analyzing video files and displaying the results
 */

import React, { useState, useEffect, useRef } from 'react';
import { useVideoService } from '../hooks/useVideoService';
import {
  VideoFile,
  VideoAnalysis,
  Scene,
  VideoFrame,
  ClipType,
  VideoProcessingProgress
} from '../types/video-types';

interface VideoAnalyzerProps {
  videoFile?: File;
  onAnalysisComplete?: (analysis: VideoAnalysis) => void;
  width?: string | number;
  height?: string | number;
  autoStart?: boolean;
  showThumbnails?: boolean;
  thumbnailsPerRow?: number;
  className?: string;
}

const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({
  videoFile,
  onAnalysisComplete,
  width = '100%',
  height = 'auto',
  autoStart = false,
  showThumbnails = true,
  thumbnailsPerRow = 4,
  className = ''
}: any) => {
  // State
  const [_currentFrame, _setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Hook for VideoService
  const {
    videoFile: loadedVideoFile,
    videoAnalysis,
    isAnalyzing,
    error,
    progress,
    extractedFrames,
    scenes,
    loadVideoFile,
    analyzeVideo,
    _getFrameAtTime,
    getSceneAtTime
  } = useVideoService();
  
  // Load video file when provided
  useEffect(() => {
    if (videoFile) {
      loadVideoFile(videoFile).then(() => {
        if (autoStart) {
          analyzeVideo(videoFile);
        }
      });
    }
  }, [videoFile, loadVideoFile, analyzeVideo, autoStart]);
  
  // Notify parent component when analysis completes
  useEffect(() => {
    if (videoAnalysis && onAnalysisComplete) {
      onAnalysisComplete(videoAnalysis);
    }
  }, [videoAnalysis, onAnalysisComplete]);
  
  // Handle video playback
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play();
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isPlaying]);
  
  // Draw visualization on canvas
  useEffect(() => {
    const drawVisualization = () => {
      if (!canvasRef.current || !videoAnalysis) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw timeline
      const timelineHeight = 50;
      const timelineY = canvas.height - timelineHeight;
      
      // Background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, timelineY, canvas.width, timelineHeight);
      
      // Draw scenes
      if (scenes.length > 0) {
        const pixelsPerSecond = canvas.width / videoAnalysis.duration;
        
        scenes.forEach((scene: any, index: any) => {
          const x = scene.startTime * pixelsPerSecond;
          const width = scene.duration * pixelsPerSecond;
          
          // Alternate colors for better visibility
          ctx.fillStyle = index % 2 === 0 ? '#3a3a3a' : '#2a2a2a';
          ctx.fillRect(x, timelineY, width, timelineHeight);
          
          // Highlight selected scene
          if (selectedScene && selectedScene.id === scene.id) {
            ctx.strokeStyle = '#ff7a45';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, timelineY, width, timelineHeight);
          }
          
          // Scene boundaries
          ctx.fillStyle = '#ff7a45';
          ctx.fillRect(x, timelineY, 2, timelineHeight);
        });
        
        // Current position marker
        if (videoRef.current) {
          const currentTime = videoRef.current.currentTime;
          const x = currentTime * pixelsPerSecond;
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, timelineY, 2, timelineHeight);
        }
      }
      
      // Request next frame if playing
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawVisualization);
      }
    };
    
    drawVisualization();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [videoAnalysis, scenes, selectedScene, isPlaying]);
  
  // Start analysis
  const handleStartAnalysis = () => {
    if (videoFile) {
      analyzeVideo(videoFile);
    }
  };
  
  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoAnalysis) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    const clickedTime = (x / width) * videoAnalysis.duration;
    
    // Set video time
    videoRef.current.currentTime = clickedTime;
    
    // Find scene at this time
    const scene = getSceneAtTime(clickedTime);
    if (scene) {
      setSelectedScene(scene);
    }
  };
  
  // Get clip type label with color
  const getClipTypeLabel = (type: ClipType) => {
    const clipTypeColors: Record<ClipType, string> = {
      [ClipType.PERFORMANCE]: '#8884d8',
      [ClipType.B_ROLL_STATIC]: '#82ca9d',
      [ClipType.B_ROLL_DYNAMIC]: '#ffc658',
      [ClipType.ACTION]: '#ff7a45',
      [ClipType.UNKNOWN]: '#808080'
    };
    
    return (
      <span
        className="px-2 py-1 rounded text-xs font-semibold"
        style={{ backgroundColor: clipTypeColors[type], color: '#ffffff' }}
      >
        {type}
      </span>
    );
  };
  
  // Render progress bar
  const renderProgress = (progress: VideoProcessingProgress) => {
    return (
      <div className="w-full mt-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{progress.stage}</span>
          <span className="text-sm font-medium">{Math.round(progress.progress * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full"
            style={{ width: `${progress.progress * 100}%` }}
          ></div>
        </div>
        <p className="text-sm mt-1 text-gray-400">{progress.message}</p>
      </div>
    );
  };
  
  // Render thumbnails grid
  const renderThumbnails = () => {
    if (!showThumbnails || !extractedFrames.length) return null;
    
    const gridTemplateColumns = `repeat(${thumbnailsPerRow}, 1fr)`;
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Extracted Frames</h3>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns }}
        >
          {extractedFrames.map((frame: any) => (
            <div
              key={frame.index}
              className="relative cursor-pointer transition-transform hover:scale-105"
              onClick={() => videoRef.current && (videoRef.current.currentTime = frame.time)}
            >
              <img
                src={frame.thumbnail}
                alt={`Frame ${frame.index}`}
                className="w-full h-auto rounded"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center">
                {frame.time.toFixed(2)}s
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render scenes list
  const renderScenes = () => {
    if (!scenes.length) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Detected Scenes</h3>
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
          {scenes.map((scene: any) => (
            <div
              key={scene.id}
              className={`p-2 rounded cursor-pointer ${
                selectedScene?.id === scene.id
                  ? 'bg-purple-900 border border-purple-500'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => {
                setSelectedScene(scene);
                if (videoRef.current) {
                  videoRef.current.currentTime = scene.startTime;
                }
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">Scene {scenes.indexOf(scene) + 1}</span>
                <span className="text-sm text-gray-400">
                  {scene.duration.toFixed(2)}s
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {scene.startTime.toFixed(2)}s - {scene.endTime.toFixed(2)}s
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render analysis results
  const renderAnalysisResults = () => {
    if (!videoAnalysis) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
        <div className="bg-gray-800 p-3 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Clip Type</p>
              <div className="mt-1">{getClipTypeLabel(videoAnalysis.clipType)}</div>
            </div>
            <div>
              <p className="text-gray-400">Duration</p>
              <p>{videoAnalysis.duration.toFixed(2)} seconds</p>
            </div>
            <div>
              <p className="text-gray-400">Scenes</p>
              <p>{videoAnalysis.scenes.length}</p>
            </div>
            <div>
              <p className="text-gray-400">Motion</p>
              <p>{videoAnalysis.motionData.averageMotion.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Additional analysis details */}
          <div className="mt-4">
            <p className="text-gray-400">Motion</p>
            <div className="h-24 bg-gray-900 rounded mt-1 relative overflow-hidden">
              {videoAnalysis.motionData.motionByFrame.map((motion: any, index: any) => {
                const height = Math.min(Math.max(motion.motionAmount * 5, 2), 100);
                const x = (index / videoAnalysis.motionData.motionByFrame.length) * 100;
                return (
                  <div
                    key={index}
                    className="absolute bottom-0 bg-blue-500 w-1"
                    style={{
                      height: `${height}%`,
                      left: `${x}%`,
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`} style={{ width, height }}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Video Analysis</h2>
          {!isAnalyzing && !videoAnalysis && videoFile && (
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              onClick={handleStartAnalysis}
            >
              Start Analysis
            </button>
          )}
          {isPlaying ? (
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              onClick={() => setIsPlaying(false)}
            >
              Pause
            </button>
          ) : (
            videoAnalysis && (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                onClick={() => setIsPlaying(true)}
              >
                Play
              </button>
            )
          )}
        </div>
        
        {error && (
          <div className="bg-red-900 text-white p-3 rounded mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {isAnalyzing && progress && renderProgress(progress)}
        
        {loadedVideoFile && (
          <div className="relative">
            <video
              ref={videoRef}
              src={loadedVideoFile.blobUrl}
              className="w-full rounded"
              controls={!isAnalyzing}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  const time = videoRef.current.currentTime;
                  const scene = getSceneAtTime(time);
                  if (scene && (!selectedScene || selectedScene.id !== scene.id)) {
                    setSelectedScene(scene);
                  }
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            <div
              className="w-full h-12 mt-2 bg-gray-800 cursor-pointer"
              onClick={handleTimelineClick}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={50}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>{renderScenes()}</div>
          <div>{renderAnalysisResults()}</div>
        </div>
        
        {renderThumbnails()}
      </div>
    </div>
  );
};

export default VideoAnalyzer;