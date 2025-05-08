import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Settings, ChevronRight, AlertCircle } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { useAnalysis } from '@/context/AnalysisContext';
import editDecisionEngine from '@/engine/EditDecisionEngine';

interface EditingStepProps {
  audioElement: HTMLAudioElement | null;
}

export const EditingStep: React.FC<EditingStepProps> = ({ audioElement }) => {
  const { state, dispatch } = useProject();
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    editDecisions, 
    musicFile, 
    videoAnalyses,
    settings
  } = state;
  const { state: analysisState } = useAnalysis();
  
  const [currentEditIndex, setCurrentEditIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Regenerate edit decisions based on current settings
  const regenerateEditDecisions = async () => {
    if (!analysisState.audioAnalysis || Object.keys(analysisState.videoAnalyses).length === 0) {
      setError('Cannot regenerate edit decisions: Missing analysis data');
      return;
    }
    
    setRegenerating(true);
    setError(null);
    
    try {
      // Configure the edit decision engine with current settings
      const config = {
        beatCutPercentage: settings.style === 'Dynamic' ? 70 : 
                          settings.style === 'Minimal' ? 30 : 50,
        minSceneDuration: settings.style === 'Cinematic' ? 2.0 : 1.0,
        maxSceneDuration: settings.style === 'Dynamic' ? 3.0 : 
                         settings.style === 'Cinematic' ? 8.0 : 5.0,
        prioritizeSceneBoundaries: settings.style === 'Smooth' || settings.style === 'Cinematic',
        energyThreshold: {
          low: 0.3,
          medium: 0.6,
          high: 0.8
        }
      };
      
      // Create a new engine instance with the config
      const engine = new editDecisionEngine.constructor(config);
      
      // Configure with analysis data
      engine.setAudioAnalysis(analysisState.audioAnalysis);
      
      // Add each video analysis
      Object.entries(analysisState.videoAnalyses).forEach(([id, analysis]) => {
        engine.addVideoAnalysis(id, analysis);
      });
      
      // Generate new edit decisions
      const editDecisionResult = engine.generateEditDecisions();
      
      // Update project state with new edit decisions
      const newEditDecisions = editDecisionResult.edl.clips.map((clip, index) => ({
        time: clip.timelineInPoint,
        videoId: clip.sourceId,
        sceneIndex: index,
        start: clip.sourceInPoint,
        duration: clip.timelineOutPoint - clip.timelineInPoint
      }));
      
      dispatch({
        type: 'SET_EDIT_DECISIONS',
        payload: newEditDecisions
      });
      
      // Reset playback position
      if (audioElement) {
        audioElement.currentTime = 0;
      }
      dispatch({ type: 'SET_PLAYBACK_TIME', payload: 0 });
      
    } catch (error) {
      console.error('Error regenerating edit decisions:', error);
      setError(`Failed to regenerate edit decisions: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRegenerating(false);
    }
  };
  
  // Go to preview
  const goToPreview = () => {
    dispatch({ type: 'SET_STEP', payload: 'preview' });
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
      {/* Main editing area */}
      <div className="flex-grow flex">
        {/* Left panel - Timeline and controls */}
        <div className="w-3/4 p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Edit Timeline</h2>
          
          {/* Timeline */}
          <div className="flex-grow flex flex-col">
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
            <div className="flex items-center justify-center mb-6">
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
            <div className="flex justify-between text-sm text-[#B0B0B5] mb-8">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            {/* Edit decisions list */}
            <div className="flex-grow overflow-y-auto">
              <h3 className="text-lg font-medium mb-2">Edit Decisions</h3>
              
              <div className="space-y-2">
                {editDecisions.map((edit, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg flex items-center ${
                      index === currentEditIndex ? 'bg-[#2A2A30] border-l-4 border-[#FF7A45]' : 'bg-[#1E1E24]'
                    }`}
                    onClick={() => {
                      dispatch({ type: 'SET_PLAYBACK_TIME', payload: edit.time });
                      if (audioElement) {
                        audioElement.currentTime = edit.time;
                      }
                    }}
                  >
                    <div className="mr-3 text-[#B0B0B5]">{index + 1}</div>
                    <div className="flex-grow">
                      <p className="font-medium">{getVideoName(edit.videoId)}</p>
                      <p className="text-sm text-[#B0B0B5]">
                        {formatTime(edit.time)} - Scene {edit.sceneIndex + 1}
                      </p>
                    </div>
                    <div className="text-right text-[#B0B0B5]">
                      {edit.duration.toFixed(1)}s
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right panel - Settings and preview */}
        <div className="w-1/4 bg-[#1E1E24] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Settings</h2>
            <button 
              className="p-2 rounded-full hover:bg-[#2A2A30]"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={20} />
            </button>
          </div>
          
          {showSettings ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#B0B0B5] mb-1">Music Genre</label>
                <select 
                  className="w-full bg-[#2A2A30] text-[#F5F5F7] p-2 rounded"
                  value={settings.genre}
                  onChange={(e) => dispatch({ 
                    type: 'SET_SETTINGS', 
                    payload: { ...settings, genre: e.target.value } 
                  })}
                >
                  <option>Hip-Hop/Rap</option>
                  <option>Pop</option>
                  <option>Rock</option>
                  <option>Electronic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-[#B0B0B5] mb-1">Editing Style</label>
                <select 
                  className="w-full bg-[#2A2A30] text-[#F5F5F7] p-2 rounded"
                  value={settings.style}
                  onChange={(e) => dispatch({ 
                    type: 'SET_SETTINGS', 
                    payload: { ...settings, style: e.target.value } 
                  })}
                >
                  <option>Dynamic</option>
                  <option>Smooth</option>
                  <option>Cinematic</option>
                  <option>Minimal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-[#B0B0B5] mb-1">Transitions</label>
                <select 
                  className="w-full bg-[#2A2A30] text-[#F5F5F7] p-2 rounded"
                  value={settings.transitions}
                  onChange={(e) => dispatch({ 
                    type: 'SET_SETTINGS', 
                    payload: { ...settings, transitions: e.target.value } 
                  })}
                >
                  <option>Auto (Based on Music)</option>
                  <option>Cut Only</option>
                  <option>Dissolve</option>
                  <option>Wipe</option>
                </select>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-[#3A1A1A] border border-[#E53935] rounded-lg text-sm text-[#F5F5F7] flex items-start">
                  <AlertCircle size={16} className="text-[#E53935] mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <button
                className={`w-full py-2 rounded-lg mt-4 flex items-center justify-center ${
                  regenerating
                    ? 'bg-[#2A2A30] text-[#B0B0B5] cursor-not-allowed'
                    : 'bg-[#FF7A45] hover:bg-[#FF6A35] text-[#F5F5F7]'
                }`}
                onClick={regenerateEditDecisions}
                disabled={regenerating}
              >
                {regenerating ? 'Regenerating...' : 'Apply Settings & Regenerate'}
              </button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col">
              {/* Current edit info */}
              {currentEdit && (
                <div className="bg-[#2A2A30] p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-2">Current Clip</h3>
                  <p className="text-sm mb-1">
                    <span className="text-[#B0B0B5]">Video: </span>
                    {getVideoName(currentEdit.videoId)}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="text-[#B0B0B5]">Scene: </span>
                    {currentEdit.sceneIndex + 1}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="text-[#B0B0B5]">Start: </span>
                    {formatTime(currentEdit.start)}
                  </p>
                  <p className="text-sm">
                    <span className="text-[#B0B0B5]">Duration: </span>
                    {currentEdit.duration.toFixed(1)}s
                  </p>
                </div>
              )}
              
              {/* Music file info */}
              {musicFile && (
                <div className="bg-[#2A2A30] p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Music Track</h3>
                  <p className="text-sm mb-1">{musicFile.name}</p>
                  <p className="text-sm text-[#B0B0B5]">
                    {formatTime(0)} - {formatTime(duration)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Preview button */}
          <button 
            className="mt-auto py-3 bg-[#FF7A45] hover:bg-[#FF6A35] rounded-lg flex items-center justify-center"
            onClick={goToPreview}
          >
            Preview
            <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
