
/**
 * InputStep.tsx
 * 
 * This component represents the first step in the workflow where users
 * select audio and video files and configure initial project settings.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Music, Video, FileUp, X, Info, Settings, Film } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { useNotification } from '../../contexts/NotificationContext';
import ProcessingProgress from '../common/ProcessingProgress';
import { mapAudioProgressToProps, mapVideoProgressToProps } from '../../constants/processingStages';
import { ProjectSettings } from '../../types/workflow';
import { audioService } from '../../services/AudioService';
import { videoService } from '../../services/VideoService';
import { ExtendedFile } from '../../types/ExtendedFile';
import { perfMonitor } from '../../utils/perfMonitor';

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
  
  const { showNotification } = useNotification();
  
  // Local state for drag-and-drop highlighting
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingRawVideo, setIsDraggingRawVideo] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Track component mount/unmount performance
  useEffect(() => {
    // Mark component mount
    perfMonitor.mark('input-step-mount');
    
    // Return cleanup function to mark unmount
    return () => {
      perfMonitor.mark('input-step-unmount');
      perfMonitor.measure(
        'input-step-lifetime',
        'input-step-mount',
        'input-step-unmount'
      );
    };
  }, []);
  
  // Setup dropzone for audio
  const onAudioDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0] as ExtendedFile;
      
      try {
        /**
         * INTEGRATION POINT: InputModule -> AudioService
         * 
         * Here the InputModule integrates with AudioService to process uploaded audio files.
         * The flow is:
         * 1. User drops an audio file in the UI
         * 2. We get the AudioService singleton instance
         * 3. We create a progress callback to update the UI during processing
         * 4. AudioService.loadAudio() loads and decodes the audio file
         * 5. AudioService.extractWaveform() analyzes the audio to create visualization data
         * 6. Results are stored in the workflow state for downstream processing
         * 
         * This integration is critical as it initializes the audio analysis pipeline
         * that will later be used by EditDecisionEngine to create edit points.
         */
        // Start performance tracking for audio processing
        perfMonitor.mark('audio-processing-start');
        
        // Use AudioService to load and analyze the audio file
        // Use the exported singleton instance
        
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
        perfMonitor.mark('audio-load-start');
        const audioBuffer = await audioService.loadAudio(file, progressCallback);
        perfMonitor.mark('audio-load-end');
        perfMonitor.measure('audio-file-loading', 'audio-load-start', 'audio-load-end');
        
        // Extract waveform data for visualization
        perfMonitor.mark('waveform-extraction-start');
        const waveform = await audioService.extractWaveform(audioBuffer);
        perfMonitor.mark('waveform-extraction-end');
        perfMonitor.measure('waveform-extraction', 'waveform-extraction-start', 'waveform-extraction-end');
        
        // End performance tracking for audio processing
        perfMonitor.mark('audio-processing-end');
        perfMonitor.measure('audio-processing-total', 'audio-processing-start', 'audio-processing-end');
        
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

        showNotification('success', 'Audio processing completed successfully!');
      } catch (error) {
        console.error('Error processing audio file:', error);
        
        // End performance tracking on error
        if (performance.getEntriesByName('audio-processing-start').length > 0) {
          perfMonitor.mark('audio-processing-error');
          perfMonitor.measure('audio-processing-failed', 'audio-processing-start', 'audio-processing-error');
        }
        
        // Update state with error
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            audioProgress: null,
            errors: {
              ...prev.ui.errors,
              audioUpload: `Error processing audio file: ${(error as Error).message}`
            }
          }
        }));

        showNotification('error', `Error processing audio file: ${(error as Error).message}`, {
          actionLabel: 'Retry',
          onAction: () => {
            setRetryCount(prev => prev + 1);
            onAudioDrop([file]);
          }
        });
      }
    }
  }, [setData, showNotification, retryCount]);
  
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
    /**
     * INTEGRATION POINT: InputModule -> VideoService
     * 
     * Here the InputModule integrates with VideoService to process uploaded video files.
     * The flow is:
     * 1. User drops video files in the UI
     * 2. We get the VideoService singleton instance
     * 3. For each video file, VideoService.loadVideoFile() processes it to:
     *    - Extract metadata (duration, dimensions, fps)
     *    - Generate a thumbnail
     *    - Create a blob URL for preview
     * 4. Results are stored in the workflow state for downstream processing
     * 
     * This integration is critical as it prepares video files that will later be
     * analyzed by EditDecisionEngine to match with audio beats and create the edit.
     */
    
    // Start performance tracking for all video processing
    perfMonitor.mark('video-processing-batch-start');
    
    // Process each video file
    for (const file of acceptedFiles) {
      try {
        // Start performance tracking for this video file
        const videoMarkPrefix = `video-processing-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
        perfMonitor.mark(`${videoMarkPrefix}-start`);
        
        // Set up progress tracking
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            videoProgress: {
              percentage: 0,
              currentStep: 'Loading video...'
            },
            errors: {
              ...prev.ui.errors,
              videoUpload: null
            }
          }
        }));

        // Use VideoService to load and process the video file
        const videoFile = await perfMonitor.trackTime(
          `video-load-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
          () => videoService.loadVideoFile(file as ExtendedFile)
        );
        
        // Add the processed video file to the workflow state
        addVideoFile({
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
          duration: videoFile.duration,
          width: videoFile.resolution.width,
          height: videoFile.resolution.height,
          fps: videoFile.frameRate,
          url: videoFile.url || '',
          thumbnail: videoFile.url || ''
        } as any);

        // Update progress to complete
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            videoProgress: {
              percentage: 100,
              currentStep: 'Complete'
            }
          }
        }));

        // End performance tracking for this video file
        perfMonitor.mark(`${videoMarkPrefix}-end`);
        perfMonitor.measure(
          `video-processing-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
          `${videoMarkPrefix}-start`,
          `${videoMarkPrefix}-end`
        );

        showNotification('success', `Video "${file.name}" processed successfully!`);
      } catch (error) {
        console.error('Error processing video file:', error);
        
        // End performance tracking on error
        const videoMarkPrefix = `video-processing-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
        if (performance.getEntriesByName(`${videoMarkPrefix}-start`).length > 0) {
          perfMonitor.mark(`${videoMarkPrefix}-error`);
          perfMonitor.measure(
            `video-processing-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}-failed`,
            `${videoMarkPrefix}-start`,
            `${videoMarkPrefix}-error`
          );
        }
        
        // Update state with error
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            videoProgress: null,
            errors: {
              ...prev.ui.errors,
              videoUpload: `Error processing video file ${file.name}: ${(error as Error).message}`
            }
          }
        }));

        showNotification('error', `Error processing video file ${file.name}: ${(error as Error).message}`, {
          actionLabel: 'Retry',
          onAction: () => {
            setRetryCount(prev => prev + 1);
            onVideoDrop([file]);
          }
        });
      }
    }
    
    // End performance tracking for all video processing
    perfMonitor.mark('video-processing-batch-end');
    perfMonitor.measure(
      'video-processing-batch-total',
      'video-processing-batch-start',
      'video-processing-batch-end'
    );
  }, [addVideoFile, setData, showNotification, retryCount]);
  
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
    // Start performance tracking for all raw video processing
    perfMonitor.mark('raw-video-processing-batch-start');
    
    // Process each raw video file
    for (const file of acceptedFiles) {
      try {
        // Start performance tracking for this raw video file
        const rawVideoMarkPrefix = `raw-video-processing-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
        perfMonitor.mark(`${rawVideoMarkPrefix}-start`);
        
        // Set up progress tracking
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            rawVideoProgress: {
              percentage: 0,
              currentStep: 'Loading raw video...'
            },
            errors: {
              ...prev.ui.errors,
              rawVideoUpload: null
            }
          }
        }));

        // Validate video file format
        const validVideoFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
        if (!validVideoFormats.includes(file.type)) {
          setData(prev => ({
            ...prev,
            ui: {
              ...prev.ui,
              rawVideoProgress: null,
              errors: {
                ...prev.ui.errors,
                rawVideoUpload: `Invalid video format: ${file.type}. Supported formats: MP4, MOV, AVI, WebM`
              }
            }
          }));

          // End performance tracking for validation error
          perfMonitor.mark(`${rawVideoMarkPrefix}-validation-error`);
          perfMonitor.measure(
            `raw-video-validation-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}-failed`,
            `${rawVideoMarkPrefix}-start`,
            `${rawVideoMarkPrefix}-validation-error`
          );

          showNotification('error', `Invalid video format: ${file.type}. Supported formats: MP4, MOV, AVI, WebM`);
          continue;
        }
        
        // Use VideoService to load and process the video file
        const videoFile = await perfMonitor.trackTime(
          `raw-video-load-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
          () => videoService.loadVideoFile(file as ExtendedFile)
        );
        
        // Add the processed raw video file to the workflow state
        addRawVideoFile({
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
          duration: videoFile.duration,
          width: videoFile.resolution.width,
          height: videoFile.resolution.height,
          fps: videoFile.frameRate,
          url: videoFile.url || '',
          thumbnail: videoFile.url || ''
        } as any);

        // Update progress to complete
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            rawVideoProgress: {
              percentage: 100,
              currentStep: 'Complete'
            }
          }
        }));

        // End performance tracking for this raw video file
        perfMonitor.mark(`${rawVideoMarkPrefix}-end`);
        perfMonitor.measure(
          `raw-video-processing-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
          `${rawVideoMarkPrefix}-start`,
          `${rawVideoMarkPrefix}-end`
        );

        showNotification('success', `Raw video "${file.name}" processed successfully!`);
      } catch (error) {
        console.error('Error processing raw video file:', error);
        
        // End performance tracking on error
        const rawVideoMarkPrefix = `raw-video-processing-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
        if (performance.getEntriesByName(`${rawVideoMarkPrefix}-start`).length > 0) {
          perfMonitor.mark(`${rawVideoMarkPrefix}-error`);
          perfMonitor.measure(
            `raw-video-processing-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}-failed`,
            `${rawVideoMarkPrefix}-start`,
            `${rawVideoMarkPrefix}-error`
          );
        }
        
        // Update state with error
        setData(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            rawVideoProgress: null,
            errors: {
              ...prev.ui.errors,
              rawVideoUpload: `Error processing raw video file ${file.name}: ${(error as Error).message}`
            }
          }
        }));

        showNotification('error', `Error processing raw video file ${file.name}: ${(error as Error).message}`, {
          actionLabel: 'Retry',
          onAction: () => {
            setRetryCount(prev => prev + 1);
            onRawVideoDrop([file]);
          }
        });
      }
    }
    
    // End performance tracking for all raw video processing
    perfMonitor.mark('raw-video-processing-batch-end');
    perfMonitor.measure(
      'raw-video-processing-batch-total',
      'raw-video-processing-batch-start',
      'raw-video-processing-batch-end'
    );
  }, [addRawVideoFile, setData, showNotification, retryCount]);
  
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
    // Track performance for analysis transition
    perfMonitor.mark('analyze-button-click');
    
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
    
    // Preload the analysis step component
    import('./AnalysisStep').catch(error => {
      console.warn('Failed to preload AnalysisStep:', error);
    });
    
    // Navigate to analysis step
    goToStep('analysis' as any);
    
    // Mark end of transition
    perfMonitor.mark('analyze-transition-complete');
    perfMonitor.measure(
      'analyze-transition-time',
      'analyze-button-click',
      'analyze-transition-complete'
    );
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

  // Handle retry for audio processing
  const handleRetryAudio = () => {
    if (state.project.musicFile?.file) {
      setRetryCount(prev => prev + 1);
      onAudioDrop([state.project.musicFile.file]);
    }
  };

  // Handle retry for video processing
  const handleRetryVideo = (file: File) => {
    setRetryCount(prev => prev + 1);
    onVideoDrop([file]);
  };

  // Handle retry for raw video processing
  const handleRetryRawVideo = (file: File) => {
    setRetryCount(prev => prev + 1);
    onRawVideoDrop([file]);
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
                        d={`M 0,50 ${state.project.musicFile.waveform.map((value: number, index: number) => `L ${index},${50 - value * 40}`).join(' ')}`}
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
            <div className="mt-4">
              <ProcessingProgress
                {...mapAudioProgressToProps(
                  state.ui.audioProgress.percentage,
                  state.ui.audioProgress.currentStep,
                  state.ui.errors?.audioUpload || null,
                  state.ui.audioProgress.percentage === 100
                )}
                onRetry={handleRetryAudio}
              />
            </div>
          )}
          
          {/* Display error message if there's an error with audio upload */}
          {state.ui.errors.audioUpload && !state.ui.audioProgress && (
            <div className="mt-2 p-3 bg-[#4A2525] rounded-md">
              <p className="text-[#F56565] text-sm">{state.ui.errors.audioUpload}</p>
              <button
                onClick={handleRetryAudio}
                className="mt-2 text-sm bg-[#F56565] text-white py-1 px-3 rounded hover:bg-[#E53E3E] transition-colors"
              >
                Retry
              </button>
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
                  {state.project.videoFiles.map((file: any, index: number) => (
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

          {/* Display video processing progress if applicable */}
          {state.ui.videoProgress && (
            <div className="mt-4">
              <ProcessingProgress
                {...mapVideoProgressToProps(
                  state.ui.videoProgress.percentage / 100, // Convert to 0-1 range
                  state.ui.videoProgress.currentStep,
                  state.ui.errors?.videoUpload || null,
                  state.ui.videoProgress.percentage === 100
                )}
                onRetry={() => {
                  // Find the last video file that was being processed
                  if (state.project.videoFiles.length > 0) {
                    const lastFile = state.project.videoFiles[state.project.videoFiles.length - 1].file;
                    handleRetryVideo(lastFile);
                  }
                }}
              />
            </div>
          )}
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
                  {state.project.rawVideoFiles.map((file: any, index: number) => (
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
          
          {/* Display raw video processing progress if applicable */}
          {state.ui.rawVideoProgress && (
            <div className="mt-4">
              <ProcessingProgress
                {...mapVideoProgressToProps(
                  state.ui.rawVideoProgress.percentage / 100, // Convert to 0-1 range
                  state.ui.rawVideoProgress.currentStep,
                  state.ui.errors?.rawVideoUpload || null,
                  state.ui.rawVideoProgress.percentage === 100
                )}
                onRetry={() => {
                  // Find the last raw video file that was being processed
                  if (state.project.rawVideoFiles.length > 0) {
                    const lastFile = state.project.rawVideoFiles[state.project.rawVideoFiles.length - 1].file;
                    handleRetryRawVideo(lastFile);
                  }
                }}
              />
            </div>
          )}
          
          {/* Display error message if there's an error with video upload */}
          {state.ui.errors.videoUpload && !state.ui.videoProgress && (
            <div className="mt-2 p-3 bg-[#4A2525] rounded-md">
              <p className="text-[#F56565] text-sm">{state.ui.errors.videoUpload}</p>
              <button
                onClick={() => {
                  // Find the last video file that was being processed
                  if (state.project.videoFiles.length > 0) {
                    const lastFile = state.project.videoFiles[state.project.videoFiles.length - 1].file;
                    handleRetryVideo(lastFile);
                  }
                }}
                className="mt-2 text-sm bg-[#F56565] text-white py-1 px-3 rounded hover:bg-[#E53E3E] transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Display error message if there's an error with raw video upload */}
          {state.ui.errors.rawVideoUpload && !state.ui.rawVideoProgress && (
            <div className="mt-2 p-3 bg-[#4A2525] rounded-md">
              <p className="text-[#F56565] text-sm">{state.ui.errors.rawVideoUpload}</p>
              <button
                onClick={() => {
                  // Find the last raw video file that was being processed
                  if (state.project.rawVideoFiles.length > 0) {
                    const lastFile = state.project.rawVideoFiles[state.project.rawVideoFiles.length - 1].file;
                    handleRetryRawVideo(lastFile);
                  }
                }}
                className="mt-2 text-sm bg-[#F56565] text-white py-1 px-3 rounded hover:bg-[#E53E3E] transition-colors"
              >
                Retry
              </button>
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
