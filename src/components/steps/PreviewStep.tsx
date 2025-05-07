import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, FileUp, ChevronLeft } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

interface PreviewStepProps {
  audioElement: HTMLAudioElement | null;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ audioElement }) => {
  const { state, dispatch } = useProject();
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    editDecisions, 
    videoAnalyses 
  } = state;
  
  const [currentEditIndex, setCurrentEditIndex] = useState(0);
  
  // Update current edit index based on playback time
  useEffect(() => {
    if (editDecisions.length > 0) {
      for (let i = editDecisions.length - 1; i >= 0; i--) {
        if (currentTime >= editDecisions[i].time) {
          setCurrentEditIndex(i);
          break;
        }
      }
    }
  }, [currentTime, editDecisions]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle play/pause
  const togglePlayback = () => {
    dispatch({ type: 'SET_PLAYING', payload: !isPlaying });
  };
  
  // Track the last time a skip was performed to prevent rapid skips
  const [lastSkipTime, setLastSkipTime] = useState(0);
  
  // Skip to previous edit with debounce
  const skipToPrevious = () => {
    const now = Date.now();
    // Prevent rapid skips (debounce)
    if (now - lastSkipTime < 300) {
      return;
    }
    
    setLastSkipTime(now);
    
    if (currentEditIndex > 0) {
      const prevIndex = currentEditIndex - 1;
      const prevTime = editDecisions[prevIndex].time;
      
      // First update the state
      dispatch({ type: 'SET_PLAYBACK_TIME', payload: prevTime });
      
      // Then update the audio element
      if (audioElement) {
        audioElement.currentTime = prevTime;
      }
    }
  };
  
  // Skip to next edit with debounce
  const skipToNext = () => {
    const now = Date.now();
    // Prevent rapid skips (debounce)
    if (now - lastSkipTime < 300) {
      return;
    }
    
    setLastSkipTime(now);
    
    if (currentEditIndex < editDecisions.length - 1) {
      const nextIndex = currentEditIndex + 1;
      const nextTime = editDecisions[nextIndex].time;
      
      // First update the state
      dispatch({ type: 'SET_PLAYBACK_TIME', payload: nextTime });
      
      // Then update the audio element
      if (audioElement) {
        audioElement.currentTime = nextTime;
      }
    }
  };
  
  // Track the last time the timeline was clicked to prevent rapid updates
  const [lastTimelineClickTime, setLastTimelineClickTime] = useState(0);
  
  // Handle timeline click with debounce
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    // Prevent rapid clicks (debounce)
    if (now - lastTimelineClickTime < 300) {
      return;
    }
    
    setLastTimelineClickTime(now);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    // First pause playback if playing
    if (isPlaying) {
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
    
    // Update the state
    dispatch({ type: 'SET_PLAYBACK_TIME', payload: newTime });
    
    // Then update the audio element
    if (audioElement) {
      audioElement.currentTime = newTime;
      
      // Resume playback after a short delay if it was playing
      if (isPlaying) {
        setTimeout(() => {
          dispatch({ type: 'SET_PLAYING', payload: true });
        }, 100);
      }
    }
  };
  
  // Go back to editing
  const goToEditing = () => {
    dispatch({ type: 'SET_STEP', payload: 'editing' });
  };
  
  // Show export modal
  const showExport = () => {
    // Dispatch an action to show the export modal in App.tsx
    dispatch({ type: 'SHOW_EXPORT_MODAL', payload: true });
  };
  
  // Get current edit decision
  const currentEdit = editDecisions[currentEditIndex] || null;
  
  // Get video name for current edit
  const getVideoName = (videoId: string) => {
    if (videoAnalyses[videoId]) {
      return videoAnalyses[videoId].clip.name;
    }
    return 'Unknown Video';
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Preview area */}
      <div className="flex-grow flex flex-col p-6">
        <div className="flex items-center mb-6">
          <button 
            className="flex items-center text-[#B0B0B5] hover:text-[#F5F5F7] mr-4"
            onClick={goToEditing}
          >
            <ChevronLeft size={20} className="mr-1" />
            Back to Editing
          </button>
          <h2 className="text-xl font-bold">Preview</h2>
        </div>
        
        {/* Video preview area */}
        <div className="flex-grow flex">
          {/* Main preview */}
          <div className="w-3/4 pr-4">
            <div className="bg-[#1E1E24] rounded-lg overflow-hidden aspect-video flex items-center justify-center mb-4">
              {currentEdit ? (
                <div className="text-center">
                  <p className="text-xl mb-2">
                    {getVideoName(currentEdit.videoId)}
                  </p>
                  <p className="text-[#B0B0B5]">
                    Scene {currentEdit.sceneIndex + 1} - {formatTime(currentEdit.start)} to {formatTime(currentEdit.start + currentEdit.duration)}
                  </p>
                </div>
              ) : (
                <p className="text-[#B0B0B5]">No preview available</p>
              )}
            </div>
            
            {/* Timeline */}
            <div 
              className="relative h-12 bg-[#1E1E24] rounded-lg mb-4 cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* Progress bar */}
              <div 
                className="absolute h-full bg-[#2A2A30] rounded-lg"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
              
              {/* Edit decision markers */}
              {editDecisions.map((edit, index) => (
                <div 
                  key={index}
                  className={`absolute h-full w-1 ${
                    index === currentEditIndex ? 'bg-[#FF7A45]' : 'bg-[#B0B0B5]'
                  }`}
                  style={{ left: `${(edit.time / duration) * 100}%` }}
                ></div>
              ))}
              
              {/* Current time indicator */}
              <div 
                className="absolute h-full w-0.5 bg-white"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            
            {/* Playback controls */}
            <div className="flex items-center justify-center mb-4">
              <button 
                className="p-2 rounded-full hover:bg-[#2A2A30]"
                onClick={skipToPrevious}
                disabled={currentEditIndex === 0}
              >
                <SkipBack size={24} className={currentEditIndex === 0 ? 'text-[#B0B0B5]' : ''} />
              </button>
              
              <button 
                className="p-3 mx-4 rounded-full bg-[#2A2A30] hover:bg-[#FF7A45]"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button 
                className="p-2 rounded-full hover:bg-[#2A2A30]"
                onClick={skipToNext}
                disabled={currentEditIndex === editDecisions.length - 1}
              >
                <SkipForward size={24} className={currentEditIndex === editDecisions.length - 1 ? 'text-[#B0B0B5]' : ''} />
              </button>
            </div>
            
            {/* Time display */}
            <div className="flex justify-between text-sm text-[#B0B0B5]">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-1/4 bg-[#1E1E24] p-4 rounded-lg flex flex-col">
            <h3 className="font-bold mb-4">Edit Sequence</h3>
            
            <div className="flex-grow overflow-y-auto mb-4">
              {editDecisions.map((edit, index) => (
                <div 
                  key={index}
                  className={`p-2 mb-2 rounded ${
                    index === currentEditIndex ? 'bg-[#2A2A30] border-l-2 border-[#FF7A45]' : 'bg-transparent'
                  }`}
                  onClick={() => {
                    dispatch({ type: 'SET_PLAYBACK_TIME', payload: edit.time });
                    if (audioElement) {
                      audioElement.currentTime = edit.time;
                    }
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 flex items-center justify-center bg-[#2A2A30] rounded-full mr-2 text-xs">
                      {index + 1}
                    </div>
                    <div className="text-sm truncate">
                      {getVideoName(edit.videoId).split('.')[0]}
                    </div>
                  </div>
                  <div className="text-xs text-[#B0B0B5] mt-1">
                    {formatTime(edit.time)} - {edit.duration.toFixed(1)}s
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="py-3 bg-[#FF7A45] hover:bg-[#FF6A35] rounded-lg flex items-center justify-center"
              onClick={showExport}
            >
              <FileUp size={18} className="mr-2" />
              Export to Premiere
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
