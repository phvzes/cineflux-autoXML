/**
 * EditingStep.tsx
 * 
 * This component represents the editing step in the workflow where
 * users can view and adjust the automatic edit decisions.
 */

import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { EditDecision, TransitionType } from '../../types/workflow';
import useAudioService from '../../hooks/useAudioService';
import WaveformVisualizer from '../../components/audio/WaveformVisualizer';

// Import icons 
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RefreshCw,
  Maximize2,
  Edit,
  Save
} from 'lucide-react';

const EditingStep: React.FC = () => {
  // Get workflow context
  const { currentStep, goToStep, data, setData } = useWorkflow();
  
  // Use audio service hook
  const {
    waveformData,
    audioBuffer,
    isPlaying,
    currentTime,
    duration,
    loadAudio,
    togglePlayPause,
    seekTo
  } = useAudioService();
  
  // Local state
  const [selectedEditIndex, setSelectedEditIndex] = useState<number | null>(null);
  const [editingDecision, setEditingDecision] = useState<EditDecision | null>(null);
  
  // Load audio file when component mounts
  useEffect(() => {
    if (data.project.musicFile && !audioBuffer) {
      loadAudio(data.project.musicFile);
    }
  }, [data.project.musicFile, audioBuffer]);
  
  // Generate mock edit decisions if none exist
  useEffect(() => {
    if (!data.edit.decisions || data.edit.decisions.length === 0) {
      // Create mock edit decisions
      const mockDecisions: EditDecision[] = [
        { time: 0, clipIndex: 0, videoTime: 0, duration: 4, transition: 'none' },
        { time: 4, clipIndex: 1, videoTime: 2, duration: 4, transition: 'cut' },
        { time: 8, clipIndex: 2, videoTime: 0, duration: 4, transition: 'dissolve' },
        { time: 12, clipIndex: 0, videoTime: 4, duration: 4, transition: 'cut' },
        { time: 16, clipIndex: 1, videoTime: 6, duration: 4, transition: 'fade' },
        { time: 20, clipIndex: 2, videoTime: 4, duration: 4, transition: 'wipe' }
      ];
      
      setData(prev => ({
        ...prev,
        edit: {
          ...prev.edit,
          decisions: mockDecisions
        }
      }));
    }
  }, [data.edit.decisions, setData]);
  
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
  
  // Update selected edit when current time changes
  useEffect(() => {
    if (currentEdit) {
      setSelectedEditIndex(currentEdit.index);
    }
  }, [currentTime, currentEdit]);
  
  // Handle seek
  const handleSeek = (time: number) => {
    seekTo(time);
  };
  
  // Go to next edit point
  const handleNextEdit = () => {
    if (!currentEdit || currentEdit.index >= (data.edit.decisions.length - 1)) return;
    
    const nextEdit = data.edit.decisions[currentEdit.index + 1];
    handleSeek(nextEdit.time);
  };
  
  // Go to previous edit point
  const handlePrevEdit = () => {
    if (!currentEdit || currentEdit.index <= 0) return;
    
    const prevEdit = data.edit.decisions[currentEdit.index - 1];
    handleSeek(prevEdit.time);
  };
  
  // Handle showing preview
  const handleShowPreview = () => {
    goToStep('preview');
  };
  
  // Handle regenerating edit
  const handleRegenerate = () => {
    // This would trigger a regeneration of edit decisions
    alert('Regenerate edit functionality will be implemented');
  };
  
  // Handle editing a decision
  const handleEditDecision = (index: number) => {
    setSelectedEditIndex(index);
    setEditingDecision({ ...data.edit.decisions[index] });
  };
  
  // Handle saving edit changes
  const handleSaveEdit = () => {
    if (editingDecision === null || selectedEditIndex === null) return;
    
    setData(prev => {
      const newDecisions = [...prev.edit.decisions];
      newDecisions[selectedEditIndex] = editingDecision;
      
      return {
        ...prev,
        edit: {
          ...prev.edit,
          decisions: newDecisions
        }
      };
    });
    
    setEditingDecision(null);
  };
  
  // Handle transition change
  const handleTransitionChange = (transition: TransitionType) => {
    if (editingDecision === null) return;
    
    setEditingDecision({
      ...editingDecision,
      transition
    });
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
    <div className="flex-grow flex flex-col p-6 gap-6">
      {/* Timeline Section */}
      <div className="border border-gray-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Timeline</h2>
        
        {/* Waveform display */}
        <div className="h-32 bg-gray-800 rounded overflow-hidden relative">
          {waveformData ? (
            <WaveformVisualizer
              waveformData={waveformData}
              beats={data.analysis.audio?.beatTimes}
              currentTime={currentTime}
              width={800}
              height={128}
              waveformColor="#2196f3"
              beatColor="#ff5722"
              positionColor="#4caf50"
              showBeats={true}
              showPosition={true}
              onPositionClick={handleSeek}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
              Waveform visualization will be displayed here
            </div>
          )}
          
          {/* Edit points */}
          <div className="absolute inset-0 pointer-events-none">
            {data.edit.decisions.map((edit, i) => {
              const position = (edit.time / data.workflow.totalDuration) * 100;
              return (
                <div 
                  key={i} 
                  className={`absolute top-0 bottom-0 w-0.5 ${
                    selectedEditIndex === i ? 'bg-yellow-400' : 'bg-yellow-600'
                  }`}
                  style={{ left: `${position}%` }}
                />
              );
            })}
          </div>
        </div>
        
        {/* Playback controls */}
        <div className="flex items-center mt-3">
          <button 
            className="p-2 bg-gray-700 rounded hover:bg-gray-600"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button 
            className="ml-2 p-2 bg-gray-700 rounded hover:bg-gray-600"
            onClick={handlePrevEdit}
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            className="ml-2 p-2 bg-gray-700 rounded hover:bg-gray-600"
            onClick={handleNextEdit}
          >
            <SkipForward size={20} />
          </button>
          
          {/* Timeline slider */}
          <div 
            className="flex-grow mx-4 bg-gray-700 h-2 rounded-full relative cursor-pointer"
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
            <div 
              className="absolute w-3 h-3 bg-white rounded-full -mt-0.5" 
              style={{left: `${(currentTime / data.workflow.totalDuration) * 100}%`}}
            />
          </div>
          
          {/* Time display */}
          <div className="text-sm text-gray-400">
            {formatTime(currentTime)} / {formatTime(data.workflow.totalDuration)}
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-1 gap-6">
        {/* Preview Panel */}
        <div className="flex-1 border border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
          <div className="flex flex-col h-full">
            <div className="flex-grow bg-black rounded relative">
              {/* Video preview placeholder */}
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                Video preview will be displayed here
              </div>
              
              {/* Current clip info overlay */}
              {currentEdit && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs p-1 rounded">
                  Clip: {videoFiles[currentEdit.clipIndex]?.name} 
                  ({formatTime(currentTime)} - {formatTime(Math.min(data.workflow.totalDuration, currentTime + 4))})
                </div>
              )}
              
              {/* Transition indicator */}
              {currentEdit && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs p-1 rounded">
                  Transition: {currentEdit.transition}
                </div>
              )}
              
              {/* Playback controls overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30"
                onClick={togglePlayPause}
              >
                <button className="p-4 bg-white bg-opacity-20 rounded-full">
                  {isPlaying ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white" />}
                </button>
              </div>
            </div>
            
            {/* Control buttons */}
            <div className="flex gap-2 mt-3">
              <button 
                className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 flex items-center"
                onClick={handlePrevEdit}
              >
                <SkipBack size={16} className="mr-1" />
                Prev Cut
              </button>
              <button 
                className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 flex items-center"
                onClick={handleNextEdit}
              >
                <SkipForward size={16} className="mr-1" />
                Next Cut
              </button>
              <div className="flex-grow" />
              <button 
                className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 flex items-center"
                onClick={handleShowPreview}
              >
                <Maximize2 size={16} className="mr-1" />
                Full Preview
              </button>
            </div>
          </div>
        </div>
        
        {/* Edit Decision Panel */}
        <div className="w-64 border border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Edit Decisions</h2>
          
          {/* Edit decision list */}
          <div className="mb-4 max-h-96 overflow-y-auto pr-2">
            {data.edit.decisions.map((decision, index) => (
              <div 
                key={index}
                className={`p-3 rounded mb-2 cursor-pointer ${
                  selectedEditIndex === index
                    ? 'bg-blue-900 bg-opacity-30 border border-blue-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => {
                  setSelectedEditIndex(index);
                  handleSeek(decision.time);
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Cut {index + 1}</span>
                  <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
                    {formatTime(decision.time)}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  Clip: {videoFiles[decision.clipIndex]?.name}
                </div>
                <div className="text-xs flex justify-between">
                  <span>Transition: {decision.transition}</span>
                  <button 
                    className="text-blue-400 hover:text-blue-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDecision(index);
                    }}
                  >
                    <Edit size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Actions */}
          <button 
            className="w-full bg-purple-700 py-2 rounded-md font-semibold hover:bg-purple-600 flex items-center justify-center mb-2"
            onClick={handleRegenerate}
          >
            <RefreshCw size={16} className="mr-2" />
            Regenerate Edit
          </button>
        </div>
      </div>
      
      {/* Edit Properties Modal */}
      {editingDecision !== null && selectedEditIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Properties</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Time
              </label>
              <input 
                type="text" 
                value={formatTime(editingDecision.time)} 
                readOnly
                className="w-full bg-gray-700 border border-gray-600 rounded p-2"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Clip
              </label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                value={editingDecision.clipIndex}
                onChange={(e) => {
                  setEditingDecision({
                    ...editingDecision,
                    clipIndex: parseInt(e.target.value)
                  });
                }}
              >
                {videoFiles.map((file, index) => (
                  <option key={index} value={index}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Transition
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'cut', 'dissolve', 'fade', 'wipe'] as TransitionType[]).map(type => (
                  <button
                    key={type}
                    className={`p-2 rounded border ${
                      editingDecision.transition === type
                        ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                        : 'border-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => handleTransitionChange(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                onClick={() => setEditingDecision(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 flex items-center"
                onClick={handleSaveEdit}
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditingStep;
