/**
 * PreviewStep.tsx
 * 
 * This component represents the preview step in the workflow where
 * users can see a full preview of the edited video.
 */

import React, { useState } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { EditDecision } from '../../types/workflow';

// Import icons 
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  Edit,
  FileUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PreviewStepProps {
  audioElement?: HTMLAudioElement | null;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ audioElement }) => {
  // Get workflow context
  const { currentStep, goToStep, data, setData } = useWorkflow();
  
  // Local state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Find current edit based on time
  const getCurrentEdit = () => {
    if (!data.edit.decisions || data.edit.decisions.length === 0) return null;
    
    for (let i = data.edit.decisions.length - 1; i >= 0; i--) {
      if (currentTime >= data.edit.decisions[i].time) {
        return { ...data.edit.decisions[i], index: i };
      }
    }
    return { ...data.edit.decisions[0], index: 0 };
  };
  
  // Current edit
  const currentEdit = getCurrentEdit();
  
  // Handle play/pause
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handle seek
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };
  
  // Go to next edit point
  const handleNextEdit = () => {
    if (!currentEdit || currentEdit.index >= (data.edit.decisions.length - 1)) return;
    
    const nextEdit = data.edit.decisions[currentEdit.index + 1];
    setCurrentTime(nextEdit.time);
  };
  
  // Go to previous edit point
  const handlePrevEdit = () => {
    if (!currentEdit || currentEdit.index <= 0) return;
    
    const prevEdit = data.edit.decisions[currentEdit.index - 1];
    setCurrentTime(prevEdit.time);
  };
  
  // Handle back to editing
  const handleBackToEdit = () => {
    goToStep('editing');
  };
  
  // Handle export
  const handleExport = () => {
    goToStep('export');
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Simulate video files if none exist
  const videoFiles = data.project.videoFiles.length > 0 
    ? data.project.videoFiles 
    : [
        { name: 'video1.mp4', size: 1000000, duration: 30, type: 'video/mp4', url: '' },
        { name: 'video2.mp4', size: 2000000, duration: 45, type: 'video/mp4', url: '' },
        { name: 'video3.mp4', size: 1500000, duration: 60, type: 'video/mp4', url: '' }
      ];
  
  return (
    <div className="flex-grow flex flex-col">
      {/* Main Preview Area */}
      <div className="flex-grow bg-black relative">
        {/* Video preview */}
        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl">
          Full video preview will be displayed here
        </div>
        
        {/* Playback controls overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress bar */}
          <div 
            className="w-full h-1 bg-gray-700 rounded-full mb-4 relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              handleSeek(percentage * data.workflow.totalDuration);
            }}
          >
            <div 
              className="absolute inset-y-0 left-0 bg-blue-500 rounded-full" 
              style={{width: `${(currentTime / data.workflow.totalDuration) * 100}%`}}
            />
            
            {/* Edit point markers */}
            {data.edit.decisions.map((edit, i) => {
              const position = (edit.time / data.workflow.totalDuration) * 100;
              return (
                <div 
                  key={i} 
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-500" 
                  style={{ left: `${position}%` }}
                />
              );
            })}
            
            {/* Scrubber handle */}
            <div 
              className="absolute -top-1.5 w-4 h-4 bg-white rounded-full transform -translate-x-1/2" 
              style={{left: `${(currentTime / data.workflow.totalDuration) * 100}%`}}
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <button 
                className="text-white hover:text-blue-400"
                onClick={handlePrevEdit}
              >
                <SkipBack size={20} />
              </button>
              <button 
                className="p-2 bg-white rounded-full text-black hover:bg-blue-400"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button 
                className="text-white hover:text-blue-400"
                onClick={handleNextEdit}
              >
                <SkipForward size={20} />
              </button>
              <div className="text-sm text-white ml-2">
                {formatTime(currentTime)} / {formatTime(data.workflow.totalDuration)}
              </div>
            </div>
            
            <div className="flex-grow"></div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Volume2 size={16} className="text-white mr-2" />
                <div className="w-20 h-1 bg-gray-700 rounded-full relative cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = (x / rect.width) * 100;
                    setVolume(Math.round(percentage));
                  }}
                >
                  <div 
                    className="absolute inset-y-0 left-0 bg-white rounded-full" 
                    style={{width: `${volume}%`}}
                  />
                </div>
              </div>
              <button 
                className="text-white hover:text-blue-400"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline Section */}
      <div className="h-24 bg-gray-800 p-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium">Timeline</h3>
          <div className="flex items-center">
            <button className="p-1 hover:bg-gray-700 rounded">
              <ChevronLeft size={16} />
            </button>
            <button className="p-1 hover:bg-gray-700 rounded">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {/* Timeline with clips */}
        <div className="relative h-16 bg-gray-900 rounded">
          {/* Current position indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white z-10" 
            style={{left: `${(currentTime / data.workflow.totalDuration) * 100}%`}}
          />
          
          {/* Clips visualization */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            {data.edit.decisions.map((edit, i) => {
              // Duration is until next edit or end
              const nextTime = i < data.edit.decisions.length - 1 
                ? data.edit.decisions[i+1].time 
                : data.workflow.totalDuration;
                
              const duration = nextTime - edit.time;
              const widthPercent = (duration / data.workflow.totalDuration) * 100;
              
              // Color based on clip type
              const clipType = "performance"; // This would come from video analysis
              const color = clipType === "performance" ? "bg-blue-700" : "bg-green-700";
              
              return (
                <div 
                  key={i} 
                  className={`h-full ${color} relative cursor-pointer`} 
                  style={{width: `${widthPercent}%`}}
                  onClick={() => setCurrentTime(edit.time)}
                >
                  {/* Thumbnail or clip label */}
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                    {i + 1}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Time markers */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 pt-1">
            <span>00:00</span>
            <span>00:30</span>
            <span>01:00</span>
            <span>01:30</span>
            <span>02:00</span>
            <span>02:30</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="bg-gray-900 p-4 flex justify-between">
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
  );
};

export default PreviewStep;