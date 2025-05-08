import { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Video, ArrowRight, X, AlertCircle, FileType, Clock, Film, Volume2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAnalysis } from '../../context/AnalysisContext';
import { useDropzone } from 'react-dropzone';
import ReactPlayer from 'react-player/lazy';
import { colorPalette } from '../../theme';
import AudioService from '../../services/AudioService';
import VideoService from '../../services/VideoService';

// Maximum file size (10MB for audio, 100MB for video)
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

// Accepted file types
const ACCEPTED_AUDIO_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/aac': ['.aac'],
};

const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-matroska': ['.mkv'],
  'video/webm': ['.webm'],
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Interface for file metadata
interface FileMetadata {
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: string;
}

// Interface for file with metadata
interface FileWithMetadata {
  file: File;
  metadata: FileMetadata;
  url: string;
  error?: string;
}

export const InputStep: React.FC = () => {
  const { state, dispatch } = useProject();
  const { musicFile, videoFiles } = state;
  
  // State for file metadata
  const [musicFileWithMetadata, setMusicFileWithMetadata] = useState<FileWithMetadata | null>(null);
  const [videoFilesWithMetadata, setVideoFilesWithMetadata] = useState<FileWithMetadata[]>([]);
  
  // Error states
  const [musicError, setMusicError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  // Refs for hidden video/audio elements used to extract metadata
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const hiddenAudioRef = useRef<HTMLAudioElement>(null);
  
  // Dropzone for music files
  const onMusicDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const error = fileRejections[0].errors[0];
      if (error.code === 'file-too-large') {
        setMusicError(`File is too large. Maximum size is ${formatFileSize(MAX_AUDIO_SIZE)}`);
      } else if (error.code === 'file-invalid-type') {
        setMusicError('Invalid file type. Please upload MP3, WAV, or M4A files');
      } else {
        setMusicError(error.message);
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      setMusicError(null);
      const file = acceptedFiles[0];
      dispatch({ type: 'SET_MUSIC_FILE', payload: file });
      
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      
      // Create initial metadata object
      const newFileWithMetadata: FileWithMetadata = {
        file,
        metadata: {},
        url,
      };
      
      setMusicFileWithMetadata(newFileWithMetadata);
      
      // Load audio to get duration
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.src = url;
        hiddenAudioRef.current.load();
      }
    }
  }, [dispatch]);
  
  const {
    getRootProps: getMusicRootProps,
    getInputProps: getMusicInputProps,
    isDragActive: isMusicDragActive,
    isDragAccept: isMusicDragAccept,
    isDragReject: isMusicDragReject,
  } = useDropzone({
    onDrop: onMusicDrop,
    accept: ACCEPTED_AUDIO_TYPES,
    maxSize: MAX_AUDIO_SIZE,
    maxFiles: 1,
    multiple: false,
  });
  
  // Dropzone for video files
  const onVideoDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const error = fileRejections[0].errors[0];
      if (error.code === 'file-too-large') {
        setVideoError(`File is too large. Maximum size is ${formatFileSize(MAX_VIDEO_SIZE)}`);
      } else if (error.code === 'file-invalid-type') {
        setVideoError('Invalid file type. Please upload MP4, MOV, or MKV files');
      } else {
        setVideoError(error.message);
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      setVideoError(null);
      const newFiles = acceptedFiles;
      
      // Update project state
      dispatch({ type: 'SET_VIDEO_FILES', payload: [...videoFiles, ...newFiles] });
      
      // Create file metadata objects
      const newFilesWithMetadata: FileWithMetadata[] = newFiles.map(file => {
        const url = URL.createObjectURL(file);
        return {
          file,
          metadata: {},
          url,
        };
      });
      
      setVideoFilesWithMetadata(prev => [...prev, ...newFilesWithMetadata]);
    }
  }, [dispatch, videoFiles]);
  
  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
    isDragAccept: isVideoDragAccept,
    isDragReject: isVideoDragReject,
  } = useDropzone({
    onDrop: onVideoDrop,
    accept: ACCEPTED_VIDEO_TYPES,
    maxSize: MAX_VIDEO_SIZE,
    multiple: true,
  });
  
  // Effect to load music file metadata when it changes
  useEffect(() => {
    if (musicFile && !musicFileWithMetadata) {
      const url = URL.createObjectURL(musicFile);
      setMusicFileWithMetadata({
        file: musicFile,
        metadata: {},
        url,
      });
      
      // Load audio to get duration
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.src = url;
        hiddenAudioRef.current.load();
      }
    }
  }, [musicFile, musicFileWithMetadata]);
  
  // Effect to load video files metadata when they change
  useEffect(() => {
    // Check if we have new video files that aren't in the metadata array
    const existingFileNames = videoFilesWithMetadata.map(item => item.file.name);
    const newFiles = videoFiles.filter(file => !existingFileNames.includes(file.name));
    
    if (newFiles.length > 0) {
      const newFilesWithMetadata = newFiles.map(file => {
        const url = URL.createObjectURL(file);
        return {
          file,
          metadata: {},
          url,
        };
      });
      
      setVideoFilesWithMetadata(prev => [...prev, ...newFilesWithMetadata]);
    }
    
    // Clean up metadata for removed files
    if (videoFilesWithMetadata.length > videoFiles.length) {
      const currentFileNames = videoFiles.map(file => file.name);
      setVideoFilesWithMetadata(prev => 
        prev.filter(item => currentFileNames.includes(item.file.name))
      );
    }
  }, [videoFiles, videoFilesWithMetadata]);
  
  // Effect to handle audio metadata loading
  useEffect(() => {
    const audioElement = hiddenAudioRef.current;
    
    if (!audioElement || !musicFileWithMetadata) return;
    
    const handleLoadedMetadata = () => {
      const duration = audioElement.duration;
      
      setMusicFileWithMetadata(prev => {
        if (!prev) return null;
        return {
          ...prev,
          metadata: {
            ...prev.metadata,
            duration,
          },
        };
      });
    };
    
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [musicFileWithMetadata]);
  
  // Function to load video metadata
  const loadVideoMetadata = useCallback((file: FileWithMetadata, index: number) => {
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.src = file.url;
    
    videoElement.onloadedmetadata = () => {
      // Get video dimensions and duration
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      const duration = videoElement.duration;
      
      // Generate thumbnail at 25% of the video
      videoElement.currentTime = duration * 0.25;
      
      videoElement.onseeked = () => {
        // Create a canvas to capture the thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw the video frame to the canvas
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          // Get the thumbnail as a data URL
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          
          // Update the metadata
          setVideoFilesWithMetadata(prev => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = {
                ...updated[index],
                metadata: {
                  ...updated[index].metadata,
                  width,
                  height,
                  duration,
                  thumbnail,
                },
              };
            }
            return updated;
          });
        }
        
        // Clean up
        URL.revokeObjectURL(videoElement.src);
      };
    };
    
    videoElement.onerror = () => {
      // Handle error
      setVideoFilesWithMetadata(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            error: 'Failed to load video metadata',
          };
        }
        return updated;
      });
      
      // Clean up
      URL.revokeObjectURL(videoElement.src);
    };
  }, []);
  
  // Effect to load metadata for video files
  useEffect(() => {
    videoFilesWithMetadata.forEach((file, index) => {
      if (!file.metadata.duration && !file.error) {
        loadVideoMetadata(file, index);
      }
    });
  }, [videoFilesWithMetadata, loadVideoMetadata]);
  
  // Remove a video file
  const removeVideoFile = (index: number) => {
    // Get the file to remove
    const fileToRemove = videoFiles[index];
    
    // Create a new array without the removed file
    const newFiles = videoFiles.filter((_, i) => i !== index);
    
    // Update the project state
    dispatch({ type: 'SET_VIDEO_FILES', payload: newFiles });
    
    // Clean up the URL
    const metadataIndex = videoFilesWithMetadata.findIndex(
      item => item.file.name === fileToRemove.name
    );
    
    if (metadataIndex !== -1) {
      URL.revokeObjectURL(videoFilesWithMetadata[metadataIndex].url);
    }
  };
  
  // Remove music file
  const removeMusicFile = () => {
    dispatch({ type: 'SET_MUSIC_FILE', payload: null });
    
    // Clean up the URL
    if (musicFileWithMetadata) {
      URL.revokeObjectURL(musicFileWithMetadata.url);
      setMusicFileWithMetadata(null);
    }
    
    setMusicError(null);
  };
  
  const { dispatch: analysisDispatch } = useAnalysis();
  
  // Start analysis
  const startAnalysis = async () => {
    if (musicFile && videoFiles.length > 0) {
      dispatch({ type: 'SET_STEP', payload: 'analyzing' });
      dispatch({ type: 'SET_ANALYZING', payload: true });
      
      const { dispatch: analysisDispatch } = useAnalysis();
      
      try {
        // Start processing
        analysisDispatch({ 
          type: 'START_PROCESSING', 
          payload: { step: 'Initializing analysis...' } 
        });
        
        // Process audio file
        const audioAnalysisPromise = AudioService.analyzeAudio(
          musicFile,
          (progress, step) => {
            analysisDispatch({
              type: 'UPDATE_PROGRESS',
              payload: { 
                progress: progress * 0.5, // Audio is 50% of total progress
                step: `Audio: ${step}`
              }
            });
          }
        );
        
        // Process video files in parallel
        const videoAnalysisPromises = videoFiles.map((file, index) => {
          return VideoService.analyzeVideo(
            file,
            (progress, step) => {
              // Each video contributes equally to the remaining 50% progress
              const videoProgressWeight = 0.5 / videoFiles.length;
              const baseProgress = 50; // Start after audio progress
              const videoProgress = baseProgress + (progress * videoProgressWeight * 100);
              
              analysisDispatch({
                type: 'UPDATE_PROGRESS',
                payload: {
                  progress: videoProgress,
                  step: `Video ${index + 1}: ${step}`
                }
              });
            }
          ).then(analysis => ({ id: `video_${index}`, analysis }));
        });
        
        // Wait for all analyses to complete
        const [audioAnalysis, ...videoAnalyses] = await Promise.all([
          audioAnalysisPromise,
          ...videoAnalysisPromises
        ]);
        
        // Store the results
        analysisDispatch({ type: 'SET_AUDIO_ANALYSIS', payload: audioAnalysis });
        
        // Store each video analysis
        videoAnalyses.forEach(({ id, analysis }) => {
          analysisDispatch({ 
            type: 'SET_VIDEO_ANALYSIS', 
            payload: { id, analysis } 
          });
        });
        
        // Convert to the format expected by the project context
        const projectAudioAnalysis = {
          beats: audioAnalysis.beats.beats.map(beat => beat.time),
          segments: audioAnalysis.energy.samples.map(sample => ({
            start: sample.time,
            duration: 0.1, // Assuming 100ms samples
            energy: sample.level
          }))
        };
        
        const projectVideoAnalyses = {};
        videoAnalyses.forEach(({ id, analysis }) => {
          projectVideoAnalyses[id] = analysis;
        });
        
        // Update project state
        dispatch({ type: 'SET_AUDIO_ANALYSIS', payload: projectAudioAnalysis });
        dispatch({ type: 'SET_VIDEO_ANALYSES', payload: projectVideoAnalyses });
        
        // Finish processing
        analysisDispatch({ type: 'FINISH_PROCESSING' });
        
        // Move to editing step
        dispatch({ type: 'SET_ANALYZING', payload: false });
        dispatch({ type: 'SET_STEP', payload: 'editing' });
      } catch (error) {
        console.error('Analysis failed:', error);
        
        // Set error state
        analysisDispatch({ 
          type: 'SET_ERROR', 
          payload: `Analysis failed: ${error instanceof Error ? error.message : String(error)}` 
        });
        
        // Return to input step
        dispatch({ type: 'SET_ANALYZING', payload: false });
      }
    }
  };
  
  // Get dropzone styles based on drag state
  const getMusicDropzoneStyle = () => {
    let borderColor = colorPalette.darkGrey;
    let bgColor = 'transparent';
    
    if (isMusicDragActive) {
      borderColor = isMusicDragAccept 
        ? colorPalette.subtleOrange 
        : isMusicDragReject 
          ? colorPalette.mutedRed 
          : colorPalette.subtleOrange;
      
      bgColor = isMusicDragAccept 
        ? 'rgba(255, 122, 69, 0.1)' 
        : isMusicDragReject 
          ? 'rgba(229, 57, 53, 0.1)' 
          : 'rgba(255, 122, 69, 0.05)';
    }
    
    return {
      borderColor,
      backgroundColor: bgColor,
    };
  };
  
  const getVideoDropzoneStyle = () => {
    let borderColor = colorPalette.darkGrey;
    let bgColor = 'transparent';
    
    if (isVideoDragActive) {
      borderColor = isVideoDragAccept 
        ? colorPalette.subtleOrange 
        : isVideoDragReject 
          ? colorPalette.mutedRed 
          : colorPalette.subtleOrange;
      
      bgColor = isVideoDragAccept 
        ? 'rgba(255, 122, 69, 0.1)' 
        : isVideoDragReject 
          ? 'rgba(229, 57, 53, 0.1)' 
          : 'rgba(255, 122, 69, 0.05)';
    }
    
    return {
      borderColor,
      backgroundColor: bgColor,
    };
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
      <div className="w-full max-w-4xl p-6 md:p-8 rounded-lg border-2 border-[#2A2A30] bg-[#1E1E24]">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#F5F5F7]">Create a New Project</h1>
        
        {/* Music File Section */}
        <div className="mb-8">
          <h2 className="text-xl mb-4 flex items-center text-[#F5F5F7]">
            <Music className="mr-2 text-[#FF7A45]" size={20} />
            Music Track
          </h2>
          
          {musicFileWithMetadata ? (
            <div className="bg-[#2A2A30] rounded-lg overflow-hidden">
              <div className="p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0 w-full md:w-48 h-32 bg-[#121218] rounded-md flex items-center justify-center">
                  <ReactPlayer
                    url={musicFileWithMetadata.url}
                    width="100%"
                    height="100%"
                    controls
                    config={{
                      file: {
                        attributes: {
                          controlsList: 'nodownload',
                        },
                      },
                    }}
                  />
                </div>
                
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-[#F5F5F7] mb-2 truncate pr-4">
                      {musicFileWithMetadata.file.name}
                    </h3>
                    <button 
                      className="text-[#E53935] hover:text-red-400 transition-colors p-1"
                      onClick={removeMusicFile}
                      aria-label="Remove music file"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[#B0B0B5]">
                    <div className="flex items-center">
                      <FileType size={14} className="mr-1" />
                      <span>{musicFileWithMetadata.file.type || 'Audio file'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>
                        {musicFileWithMetadata.metadata.duration 
                          ? formatDuration(musicFileWithMetadata.metadata.duration) 
                          : 'Loading duration...'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Volume2 size={14} className="mr-1" />
                      <span>Audio Track</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span>{formatFileSize(musicFileWithMetadata.file.size)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div 
                {...getMusicRootProps()} 
                className="w-full py-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF7A45] focus:ring-opacity-50"
                style={getMusicDropzoneStyle()}
              >
                <input {...getMusicInputProps()} />
                <div className="flex flex-col items-center justify-center">
                  <Music size={32} className="mb-2 text-[#FF7A45]" />
                  <p className="text-[#F5F5F7]">
                    {isMusicDragActive
                      ? isMusicDragAccept
                        ? 'Drop the audio file here'
                        : 'This file type is not supported'
                      : 'Drag & drop or click to select a music file'}
                  </p>
                  <p className="text-sm text-[#B0B0B5] mt-1">MP3, WAV, or M4A (max {formatFileSize(MAX_AUDIO_SIZE)})</p>
                </div>
              </div>
              
              {musicError && (
                <div className="mt-2 text-sm text-[#E53935] flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {musicError}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Video Files Section */}
        <div className="mb-8">
          <h2 className="text-xl mb-4 flex items-center text-[#F5F5F7]">
            <Video className="mr-2 text-[#FF7A45]" size={20} />
            Video Clips
          </h2>
          
          <div className="space-y-4">
            {videoFilesWithMetadata.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {videoFilesWithMetadata.map((fileWithMetadata, index) => (
                  <div key={index} className="bg-[#2A2A30] rounded-lg overflow-hidden">
                    <div className="relative">
                      {fileWithMetadata.metadata.thumbnail ? (
                        <img 
                          src={fileWithMetadata.metadata.thumbnail} 
                          alt={`Thumbnail for ${fileWithMetadata.file.name}`}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-[#121218] flex items-center justify-center">
                          <Video size={32} className="text-[#B0B0B5]" />
                        </div>
                      )}
                      
                      {fileWithMetadata.metadata.duration && (
                        <div className="absolute bottom-2 right-2 bg-[#121218] bg-opacity-80 text-[#F5F5F7] text-xs px-2 py-1 rounded">
                          {formatDuration(fileWithMetadata.metadata.duration)}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-[#F5F5F7] mb-1 truncate pr-4">
                          {fileWithMetadata.file.name}
                        </h3>
                        <button 
                          className="text-[#E53935] hover:text-red-400 transition-colors p-1"
                          onClick={() => removeVideoFile(index)}
                          aria-label="Remove video file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 text-xs text-[#B0B0B5]">
                        <div className="flex items-center">
                          <FileType size={12} className="mr-1" />
                          <span className="truncate">{fileWithMetadata.file.type.split('/')[1].toUpperCase()}</span>
                        </div>
                        
                        <div className="flex items-center justify-end">
                          <span>{formatFileSize(fileWithMetadata.file.size)}</span>
                        </div>
                        
                        {fileWithMetadata.metadata.width && fileWithMetadata.metadata.height && (
                          <div className="flex items-center">
                            <Film size={12} className="mr-1" />
                            <span>{fileWithMetadata.metadata.width}×{fileWithMetadata.metadata.height}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div 
              {...getVideoRootProps()} 
              className="w-full py-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF7A45] focus:ring-opacity-50"
              style={getVideoDropzoneStyle()}
            >
              <input {...getVideoInputProps()} />
              <div className="flex flex-col items-center justify-center">
                <Video size={32} className="mb-2 text-[#FF7A45]" />
                <p className="text-[#F5F5F7]">
                  {isVideoDragActive
                    ? isVideoDragAccept
                      ? 'Drop the video files here'
                      : 'Some files are not supported'
                    : 'Drag & drop or click to add video clips'}
                </p>
                <p className="text-sm text-[#B0B0B5] mt-1">MP4, MOV, or MKV (max {formatFileSize(MAX_VIDEO_SIZE)} per file)</p>
              </div>
            </div>
            
            {videoError && (
              <div className="mt-2 text-sm text-[#E53935] flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {videoError}
              </div>
            )}
          </div>
        </div>
        
        {/* Start Button */}
        <button 
          className={`w-full py-3 rounded-lg flex items-center justify-center transition-colors ${
            musicFile && videoFiles.length > 0
              ? 'bg-[#FF7A45] hover:bg-[#FF6A35] text-[#F5F5F7]'
              : 'bg-[#2A2A30] text-[#B0B0B5] cursor-not-allowed'
          }`}
          disabled={!musicFile || videoFiles.length === 0}
          onClick={startAnalysis}
        >
          Start Analysis
          <ArrowRight className="ml-2" size={18} />
        </button>
      </div>
      
      {/* Hidden elements for metadata extraction */}
      <audio ref={hiddenAudioRef} style={{ display: 'none' }} />
      <video ref={hiddenVideoRef} style={{ display: 'none' }} />
    </div>
  );
};
