/**
 * InputStep.tsx
 * 
 * This component represents the first step in the workflow where users
 * select audio and video files and configure initial project settings.
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Music, Video, FileUp, X, Info, Settings, Film } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { ProjectSettings } from '../../types/workflow';
import AudioService from '../../services/AudioService';
import VideoService from '../../services/VideoService';

const InputStep: React.FC = () => {
  // Get workflow context
  const { 
    state, 
    navigation: { goToStep }, 
    actions: { 
      setData, 
      addVideoFile, 
      removeVideoFile, 
      addRawVideoFile, 
      removeRawVideoFile 
    } 
  } = useWorkflow();
  
  // Local state for drag-and-drop highlighting
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingRawVideo, setIsDraggingRawVideo] = useState(false);
  
  // Setup dropzone for audio
  const onAudioDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      try {
        // Use AudioService to load and analyze the audio file
        const audioService = AudioService.getInstance();
        
        // Create a progress callback
        const progressCallback = (progress: number, step: string) => {
          setData(prev => ({
            ...prev,
            ui: {
              ...prev.ui,
              audioProgress: {
                percentage: progress,
                currentStep: step
              }
            }
          }));
        };
        
        // Load the audio file
        const audioBuffer = await audioService.loadAudio(file, progressCallback);
        
        // Extract waveform data for visualization
        const waveform = await audioService.extractWaveform(audioBuffer);
        
        // Update the workflow state with the music file and its metadata
        setData(prev => ({
          ...prev,
          project: {
            ...prev.project,
            musicFile: {
              file,
              name: file.name,
              size: file.size,
              type: file.type,
              duration: audioBuffer.duration,
              url: URL.createObjectURL(file),
              waveform: waveform.data
            }
          },
          ui: {
            ...prev.ui,
            audioProgress: null,
            errors: {
              ...prev.ui.errors,
              audioUpload: null
            }
          }
        }));
      } catch (error) {
        console.error('Error processing audio file:', error);
        
        // Update state with error
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            audioProgress: null,
            errors: {
              ...prev.ui.errors,
              audioUpload: `Error processing audio file: ${error.message}`
            }
          }
        }));
      }
    }
  }, [setData]);
  
  const {
    getRootProps: getAudioRootProps,
    getInputProps: getAudioInputProps,
  } = useDropzone({
    onDrop: onAudioDrop,
    onDragEnter: () => setIsDraggingAudio(true),
    onDragLeave: () => setIsDraggingAudio(false),
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac']
    },
    maxFiles: 1,
    multiple: false,
  });
  
  // Setup dropzone for videos
  const onVideoDrop = useCallback(async (acceptedFiles: File[]) => {
    const videoService = VideoService.getInstance();
    
    // Process each video file
    for (const file of acceptedFiles) {
      try {
        // Use VideoService to load and process the video file
        const videoFile = await videoService.loadVideoFile(file);
        
        // Add the processed video file to the workflow state
        addVideoFile({
          file,
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
          duration: videoFile.duration,
          width: videoFile.width,
          height: videoFile.height,
          fps: videoFile.fps,
          url: videoFile.blobUrl,
          thumbnail: videoFile.thumbnail
        });
      } catch (error) {
        console.error('Error processing video file:', error);
        
        // Update state with error
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            errors: {
              ...prev.ui.errors,
              videoUpload: `Error processing video file ${file.name}: ${error.message}`
            }
          }
        }));
      }
    }
  }, [addVideoFile, setData]);
  
  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
  } = useDropzone({
    onDrop: onVideoDrop,
    onDragEnter: () => setIsDraggingVideo(true),
    onDragLeave: () => setIsDraggingVideo(false),
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    }
  });
  
  // Setup dropzone for raw video files
  const onRawVideoDrop = useCallback(async (acceptedFiles: File[]) => {
    const videoService = VideoService.getInstance();
    
    // Process each raw video file
    for (const file of acceptedFiles) {
      try {
        // Validate video file format
        const validVideoFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
        if (!validVideoFormats.includes(file.type)) {
          setData(prev => ({
            ...prev,
            ui: {
              ...prev.ui,
              errors: {
                ...prev.ui.errors,
                videoUpload: `Invalid video format: ${file.type}. Supported formats: MP4, MOV, AVI, WebM`
              }
            }
          }));
          continue;
        }
        
        // Use VideoService to load and process the video file
        const videoFile = await videoService.loadVideoFile(file);
        
        // Add the processed raw video file to the workflow state
        addRawVideoFile({
          file,
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
          duration: videoFile.duration,
          width: videoFile.width,
          height: videoFile.height,
          fps: videoFile.fps,
          url: videoFile.blobUrl,
          thumbnail: videoFile.thumbnail
        });
      } catch (error) {
        console.error('Error processing raw video file:', error);
        
        // Update state with error
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            errors: {
              ...prev.ui.errors,
              videoUpload: `Error processing raw video file ${file.name}: ${error.message}`
            }
          }
        }));
      }
    }
  }, [addRawVideoFile, setData]);
  
  const {
    getRootProps: getRawVideoRootProps,
    getInputProps: getRawVideoInputProps,
  } = useDropzone({
    onDrop: onRawVideoDrop,
    onDragEnter: () => setIsDraggingRawVideo(true),
    onDragLeave: () => setIsDraggingRawVideo(false),
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    }
  });
  
  // Handle settings change
  const handleSettingChange = (setting: keyof ProjectSettings, value: string) => {
    setData(prev => ({
      ...prev,
      project: {
        ...prev.project,
        settings: {
          ...prev.project.settings,
          [setting]: value
        }
      }
    }));
  };
  
  // Handle analyze button click
  const handleAnalyze = () => {
    setData(prev => ({
      ...prev,
      workflow: {
        ...prev.workflow,
        analysisProgress: {
          percentage: 0,
          currentStep: "Starting analysis..."
        }
      },
      analysis: {
        ...prev.analysis,
        isAnalyzing: true
      }
    }));
    
    goToStep('analysis');
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };
  
  return (
    <div className="flex-grow flex flex-col p-6 gap-6">
      {/* Input Section */}
      <div className="border border-gray-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Input Files</h2>
        
        {/* Music Track Selection */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <Music size={20} />
            <span>Music Track:</span>
          </div>
          
          {!state.project.musicFile ? (
            // Dropzone for music file when none is selected
            <div 
              {...getAudioRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDraggingAudio 
                  ? 'border-blue-500 bg-blue-900 bg-opacity-10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <input {...getAudioInputProps()} />
              <FileUp className="mb-2 text-gray-400" size={36} />
              <p className="text-center text-gray-400">
                Drag & drop your music file here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: MP3, WAV, OGG, M4A, FLAC
              </p>
            </div>
          ) : (
            // Display selected music file info
            <div className="flex flex-col">
              <div className="flex gap-2 mb-2">
                <div className="flex-grow bg-gray-800 border border-gray-600 rounded p-3">
                  <div className="flex justify-between">
                    <div className="font-medium">{state.project.musicFile.name}</div>
                    <button 
                      className="text-gray-400 hover:text-red-400"
                      onClick={() => setData(prev => ({
                        ...prev,
                        project: {
                          ...prev.project,
                          musicFile: null
                        }
                      }))}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 mt-1 flex gap-4">
                    <span>{formatFileSize(state.project.musicFile.size)}</span>
                    <span>{state.project.musicFile.duration.toFixed(2)}s</span>
                    <span>{state.project.musicFile.type}</span>
                  </div>
                </div>
              </div>
              
              {/* Audio waveform preview */}
              <div className="h-16 bg-gray-800 rounded overflow-hidden relative">
                {state.project.musicFile.waveform ? (
                  <div className="w-full h-full">
                    {/* Render waveform visualization */}
                    <svg width="100%" height="100%" viewBox={`0 0 ${state.project.musicFile.waveform.length} 100`} preserveAspectRatio="none">
                      <path
                        d={`M 0,50 ${state.project.musicFile.waveform.map((value, index) => `L ${index},${50 - value * 40}`).join(' ')}`}
                        stroke="rgba(139, 92, 246, 0.8)"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Waveform preview
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Display audio processing progress if applicable */}
          {state.ui.audioProgress && (
            <div className="mt-2">
              <div className="text-sm text-gray-400">{state.ui.audioProgress.currentStep}</div>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${state.ui.audioProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Display error message if there's an error with audio upload */}
          {state.ui.errors.audioUpload && (
            <div className="mt-2 text-red-400 text-sm">
              {state.ui.errors.audioUpload}
            </div>
          )}
        </div>
        
        {/* Video Clips Selection */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <Video size={20} />
            <span>Video Clips:</span>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-grow">
              {state.project.videoFiles.length === 0 ? (
                // Dropzone for video files when none are selected
                <div 
                  {...getVideoRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer h-48 transition-colors ${
                    isDraggingVideo 
                      ? 'border-blue-500 bg-blue-900 bg-opacity-10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input {...getVideoInputProps()} />
                  <FileUp className="mb-2 text-gray-400" size={36} />
                  <p className="text-center text-gray-400">
                    Drag & drop your video clips here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: MP4, MOV, AVI, WebM
                  </p>
                </div>
              ) : (
                // Display selected video files
                <div className="bg-gray-800 border border-gray-600 rounded p-2 max-h-64 overflow-y-auto">
                  {state.project.videoFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <Video size={16} />
                        <span>{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{formatFileSize(file.size)}</span>
                        <button 
                          className="text-gray-400 hover:text-red-400"
                          onClick={() => removeVideoFile(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add more videos button */}
                  <div 
                    {...getVideoRootProps()} 
                    className="mt-2 border border-dashed border-gray-600 rounded p-2 text-center cursor-pointer hover:border-gray-500"
                  >
                    <input {...getVideoInputProps()} />
                    <span className="text-gray-400">+ Add more videos</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Raw Video Files Selection */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <Film size={20} />
            <span>Raw Video Files:</span>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-grow">
              {state.project.rawVideoFiles.length === 0 ? (
                // Dropzone for raw video files when none are selected
                <div 
                  {...getRawVideoRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer h-48 transition-colors ${
                    isDraggingRawVideo 
                      ? 'border-blue-500 bg-blue-900 bg-opacity-10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input {...getRawVideoInputProps()} />
                  <FileUp className="mb-2 text-gray-400" size={36} />
                  <p className="text-center text-gray-400">
                    Drag & drop your raw video files here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: MP4, MOV, AVI, WebM
                  </p>
                </div>
              ) : (
                // Display selected raw video files
                <div className="bg-gray-800 border border-gray-600 rounded p-2 max-h-64 overflow-y-auto">
                  {state.project.rawVideoFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <Film size={16} />
                        <span>{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{formatFileSize(file.size)}</span>
                        <button 
                          className="text-gray-400 hover:text-red-400"
                          onClick={() => removeRawVideoFile(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add more raw videos button */}
                  <div 
                    {...getRawVideoRootProps()} 
                    className="mt-2 border border-dashed border-gray-600 rounded p-2 text-center cursor-pointer hover:border-gray-500"
                  >
                    <input {...getRawVideoInputProps()} />
                    <span className="text-gray-400">+ Add more raw videos</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Display error message if there's an error with video upload */}
          {state.ui.errors.videoUpload && (
            <div className="mt-2 text-red-400 text-sm">
              {state.ui.errors.videoUpload}
            </div>
          )}
        </div>
        
        {/* Options - Only show if files are selected */}
        {state.project.musicFile && 
         (state.project.videoFiles.length > 0 || state.project.rawVideoFiles.length > 0) && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={18} />
              <h3 className="font-medium">Project Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Music Genre:</label>
                <select 
                  className="bg-gray-800 border border-gray-600 rounded p-2"
                  value={state.project.settings.genre}
                  onChange={(e) => handleSettingChange('genre', e.target.value)}
                >
                  <option>Hip-Hop/Rap</option>
                  <option>Rock</option>
                  <option>R&B</option>
                  <option>Pop</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Edit Style:</label>
                <select 
                  className="bg-gray-800 border border-gray-600 rounded p-2"
                  value={state.project.settings.style}
                  onChange={(e) => handleSettingChange('style', e.target.value)}
                >
                  <option>Dynamic</option>
                  <option>Minimal</option>
                  <option>Performance Focus</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Transitions:</label>
                <select 
                  className="bg-gray-800 border border-gray-600 rounded p-2"
                  value={state.project.settings.transitions}
                  onChange={(e) => handleSettingChange('transitions', e.target.value)}
                >
                  <option>Auto (Based on Music)</option>
                  <option>Cuts Only</option>
                  <option>Smooth</option>
                  <option>Mixed</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Export:</label>
                <select 
                  className="bg-gray-800 border border-gray-600 rounded p-2"
                  value={state.project.settings.exportFormat}
                  onChange={(e) => handleSettingChange('exportFormat', e.target.value)}
                >
                  <option>Premiere Pro XML</option>
                  <option>Final Cut Pro XML</option>
                  <option>EDL</option>
                </select>
              </div>
            </div>
            
            {/* Info message */}
            <div className="flex items-start gap-2 p-3 bg-blue-900 bg-opacity-20 border border-blue-800 rounded mb-4">
              <Info size={18} className="text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p>CineFlux will analyze your music track to detect beats, energy levels, and structure, then match your video clips to these elements.</p>
                <p className="mt-1">For best results, use high-quality music and diverse video clips.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Analyze Button */}
        <button 
          className={`w-full py-3 rounded-md font-semibold ${
            state.project.musicFile && 
            (state.project.videoFiles.length > 0 || state.project.rawVideoFiles.length > 0)
              ? 'bg-purple-700 hover:bg-purple-600'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!state.project.musicFile || 
                   (state.project.videoFiles.length === 0 && state.project.rawVideoFiles.length === 0)}
          onClick={handleAnalyze}
        >
          Analyze & Create Edit
        </button>
      </div>
      
      {/* Instructions */}
      {(!state.project.musicFile || 
        (state.project.videoFiles.length === 0 && state.project.rawVideoFiles.length === 0)) && (
        <div className="border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">1</div>
              <div>
                <h4 className="font-medium">Select a music track</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Upload the music track that will be the foundation of your video. This track will be analyzed to identify beats, sections, and energy levels.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">2</div>
              <div>
                <h4 className="font-medium">Add video clips</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Upload multiple video clips that will be automatically arranged to match the music. Include a variety of footage for best results.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">3</div>
              <div>
                <h4 className="font-medium">Add raw video files</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Upload raw video files that will be processed and included in your edit. These files will be analyzed for content and quality.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">4</div>
              <div>
                <h4 className="font-medium">Configure settings</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Select the music genre, edit style, and transition preferences. These settings help the system create an edit that matches your vision.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">5</div>
              <div>
                <h4 className="font-medium">Start analysis</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Click the "Analyze & Create Edit" button to start the process. The system will analyze your music and video files and create an initial edit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputStep;
