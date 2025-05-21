import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Film } from 'lucide-react';
import ThumbnailGrid from './ThumbnailGrid';

interface VideoAnalysisVisualizerProps {
  /**
   * The video file being analyzed
   */
  videoFile: File;
  /**
   * Array of thumbnails with timestamps
   */
  thumbnails: { timestamp: number; dataUrl: string }[];
  /**
   * Array of scene boundaries in milliseconds
   */
  sceneBoundaries: number[];
  /**
   * Video duration in seconds
   */
  duration: number;
  /**
   * Function to handle seeking to a specific time
   */
  onSeek?: (timeInSeconds: number) => void;
  /**
   * Current playback time in seconds
   */
  currentTime?: number;
  /**
   * Whether the video is currently playing
   */
  isPlaying?: boolean;
  /**
   * Function to handle play/pause toggle
   */
  onPlayPauseToggle?: () => void;
}

/**
 * Component for visualizing video analysis results
 */
const VideoAnalysisVisualizer: React.FC<VideoAnalysisVisualizerProps> = ({
  videoFile,
  thumbnails,
  sceneBoundaries,
  duration,
  onSeek,
  currentTime = 0,
  isPlaying = false,
  onPlayPauseToggle,
}: any) => {
  const [selectedScene, setSelectedScene] = useState<number | null>(null);
  
  // Update selected scene based on current time
  useEffect(() => {
    const currentTimeMs = currentTime * 1000;
    
    // Find the current scene based on scene boundaries
    for (let i = 0; i < sceneBoundaries.length; i++) {
      const sceneStart = sceneBoundaries[i];
      const sceneEnd = i < sceneBoundaries.length - 1 
        ? sceneBoundaries[i + 1] 
        : duration * 1000;
      
      if (currentTimeMs >= sceneStart && currentTimeMs < sceneEnd) {
        setSelectedScene(i);
        break;
      }
    }
  }, [currentTime, sceneBoundaries, duration]);
  
  // Handle thumbnail click
  const handleThumbnailClick = (timestamp: number) => {
    if (onSeek) {
      onSeek(timestamp / 1000); // Convert to seconds
    }
  };
  
  // Handle scene navigation
  const goToNextScene = () => {
    if (selectedScene !== null && selectedScene < sceneBoundaries.length - 1) {
      const nextSceneTime = sceneBoundaries[selectedScene + 1] / 1000;
      if (onSeek) {
        onSeek(nextSceneTime);
      }
    }
  };
  
  const goToPreviousScene = () => {
    if (selectedScene !== null && selectedScene > 0) {
      const prevSceneTime = sceneBoundaries[selectedScene - 1] / 1000;
      if (onSeek) {
        onSeek(prevSceneTime);
      }
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="video-analysis-visualizer">
      {/* Video info header */}
      <div className="flex items-center mb-4 p-4 bg-[#1E1E24] rounded-lg">
        <div className="bg-[#2A2A30] p-3 rounded-lg mr-4">
          <Film className="text-[#FF7A45]" size={24} />
        </div>
        <div className="flex-grow">
          <h3 className="font-medium text-[#F5F5F7]">{videoFile.name}</h3>
          <div className="flex text-sm text-[#B0B0B5]">
            <span className="mr-4">{formatTime(duration)}</span>
            <span>{sceneBoundaries.length} scenes detected</span>
          </div>
        </div>
      </div>
      
      {/* Playback controls */}
      <div className="flex items-center justify-center mb-6 space-x-4">
        <button 
          className="p-2 rounded-full bg-[#2A2A30] hover:bg-[#3A3A40] text-[#F5F5F7]"
          onClick={goToPreviousScene}
          disabled={selectedScene === null || selectedScene === 0}
        >
          <SkipBack size={20} />
        </button>
        
        <button 
          className="p-3 rounded-full bg-[#FF7A45] hover:bg-[#FF8C5A] text-white"
          onClick={onPlayPauseToggle}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        
        <button 
          className="p-2 rounded-full bg-[#2A2A30] hover:bg-[#3A3A40] text-[#F5F5F7]"
          onClick={goToNextScene}
          disabled={selectedScene === null || selectedScene === sceneBoundaries.length - 1}
        >
          <SkipForward size={20} />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="relative h-6 bg-[#2A2A30] rounded-full overflow-hidden">
          {/* Scene markers */}
          {sceneBoundaries.map((boundary: any, index: any) => (
            <div 
              key={index}
              className="absolute top-0 bottom-0 w-0.5 bg-[#FF7A45] z-10"
              style={{ 
                left: `${(boundary / (duration * 1000)) * 100}%`,
              }}
            />
          ))}
          
          {/* Progress indicator */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#FF7A45] transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          
          {/* Clickable area for seeking */}
          <div 
            className="absolute top-0 bottom-0 left-0 right-0 cursor-pointer"
            onClick={(e: any) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPosition = (e.clientX - rect.left) / rect.width;
              if (onSeek) {
                onSeek(clickPosition * duration);
              }
            }}
          />
          
          {/* Time indicator */}
          <div className="absolute top-0 right-2 bottom-0 flex items-center text-xs text-white">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
      
      {/* Scene information */}
      {selectedScene !== null && (
        <div className="mb-6 p-4 bg-[#1E1E24] rounded-lg">
          <h4 className="font-medium text-[#F5F5F7] mb-2">
            Scene {selectedScene + 1} of {sceneBoundaries.length}
          </h4>
          <div className="text-sm text-[#B0B0B5]">
            <div>Start: {formatTime(sceneBoundaries[selectedScene] / 1000)}</div>
            <div>
              End: {
                selectedScene < sceneBoundaries.length - 1 
                  ? formatTime(sceneBoundaries[selectedScene + 1] / 1000)
                  : formatTime(duration)
              }
            </div>
            <div>
              Duration: {
                selectedScene < sceneBoundaries.length - 1 
                  ? formatTime((sceneBoundaries[selectedScene + 1] - sceneBoundaries[selectedScene]) / 1000)
                  : formatTime((duration * 1000 - sceneBoundaries[selectedScene]) / 1000)
              }
            </div>
          </div>
        </div>
      )}
      
      {/* Thumbnails */}
      <div className="mb-6">
        <h3 className="font-medium text-[#F5F5F7] mb-4">Video Frames</h3>
        <ThumbnailGrid 
          thumbnails={thumbnails}
          sceneBoundaries={sceneBoundaries}
          onThumbnailClick={handleThumbnailClick}
          currentTime={currentTime * 1000} // Convert to milliseconds
          columns={4}
          thumbnailWidth={160}
          thumbnailHeight={90}
          showTimestamps={true}
          showSceneMarkers={true}
        />
      </div>
    </div>
  );
};

export default VideoAnalysisVisualizer;
