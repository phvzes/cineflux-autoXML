
import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { VideoService, VideoServiceEvents, VideoChunkProgress } from '../services/VideoService';
import { useNotification } from '../contexts/NotificationContext';
import ProcessingProgress from '../components/common/ProcessingProgress';
import { mapVideoProgressToProps } from '../constants/processingStages';
import { Upload, FileVideo, Database } from 'lucide-react';

const VideoProcessingTest: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [chunkProgress, setChunkProgress] = useState<VideoChunkProgress | null>(null);
  const { showNotification } = useNotification();

  // Clean up event listeners when component unmounts
  useEffect(() => {
    const videoService = VideoService.getInstance();
    
    return () => {
      videoService.removeAllListeners();
    };
  }, []);

  // Handle file upload and processing
  const handleVideoUpload = useCallback(async (videoFile: File) => {
    try {
      setFile(videoFile);
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStep('Starting video analysis...');
      setProcessingError(null);
      setIsComplete(false);
      setAnalysisResult(null);
      setChunkProgress(null);

      const videoService = VideoService.getInstance();

      // Set up event listeners for progress updates
      const handleProgress = ({ message, progress, stage }: { 
        message: string; 
        progress: number;
        stage?: string;
      }) => {
        setProcessingProgress(Math.round(progress * 100));
        setProcessingStep(message);
      };

      const handleChunkProgress = (progress: VideoChunkProgress) => {
        setChunkProgress(progress);
      };

      const handleComplete = (result: any) => {
        setIsProcessing(false);
        setProcessingProgress(100);
        setProcessingStep('Analysis complete');
        setIsComplete(true);
        setAnalysisResult(result);

        videoService.off(VideoServiceEvents.PROGRESS, handleProgress);
        videoService.off(VideoServiceEvents.CHUNK_PROGRESS, handleChunkProgress);
        videoService.off(VideoServiceEvents.ANALYSIS_COMPLETE, handleComplete);
        videoService.off(VideoServiceEvents.ERROR, handleError);

        showNotification('success', 'Video analysis completed successfully!');
      };

      const handleError = (error: Error) => {
        setIsProcessing(false);
        setProcessingError(error.message);

        videoService.off(VideoServiceEvents.PROGRESS, handleProgress);
        videoService.off(VideoServiceEvents.CHUNK_PROGRESS, handleChunkProgress);
        videoService.off(VideoServiceEvents.ANALYSIS_COMPLETE, handleComplete);
        videoService.off(VideoServiceEvents.ERROR, handleError);

        showNotification('error', `Video analysis failed: ${error.message}`, {
          actionLabel: 'Retry',
          onAction: () => handleVideoUpload(videoFile),
        });
      };

      videoService.on(VideoServiceEvents.PROGRESS, handleProgress);
      videoService.on(VideoServiceEvents.CHUNK_PROGRESS, handleChunkProgress);
      videoService.on(VideoServiceEvents.ANALYSIS_COMPLETE, handleComplete);
      videoService.on(VideoServiceEvents.ERROR, handleError);

      // Start video analysis
      await videoService.analyzeVideo(videoFile);
    } catch (error) {
      console.error('Error setting up video processing:', error);
      setIsProcessing(false);
      setProcessingError(`Error setting up video processing: ${error.message}`);
      
      showNotification('error', `Error setting up video processing: ${error.message}`, {
        actionLabel: 'Retry',
        onAction: () => handleVideoUpload(videoFile),
      });
    }
  }, [showNotification]);

  // Dropzone setup for file uploads
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const videoFile = acceptedFiles[0];
      handleVideoUpload(videoFile);
    },
    [handleVideoUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': [],
    },
    disabled: isProcessing,
    multiple: false,
  });

  // Handle retry
  const handleRetry = () => {
    if (file) {
      handleVideoUpload(file);
    }
  };

  // Handle clear cache
  const handleClearCache = () => {
    const videoService = VideoService.getInstance();
    videoService.clearCache();
    showNotification('info', 'Processing cache cleared');
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="video-processing-test p-6 bg-[#1A1A1F] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#F5F5F7]">Video Processing Test</h1>
          <button
            onClick={handleClearCache}
            className="flex items-center px-3 py-2 bg-[#2A2A30] text-[#F5F5F7] rounded hover:bg-[#3A3A3F] transition-colors"
          >
            <Database className="mr-2" size={16} />
            Clear Cache
          </button>
        </div>

        {/* File upload dropzone */}
        <div
          {...getRootProps()}
          className={`dropzone border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-[#FF7A45] bg-[#2A2A30]' : 'border-[#3A3A3F] hover:border-[#FF7A45]'
          } ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto text-[#FF7A45] mb-3" size={40} />
          <p className="text-[#F5F5F7] mb-2">
            {isDragActive
              ? 'Drop the video file here...'
              : 'Drag & drop a video file here, or click to select a file'}
          </p>
          <p className="text-[#A0A0A7] text-sm">
            Supported formats: MP4, MOV (max 500MB)
          </p>
        </div>

        {/* Processing status section */}
        {file && (
          <div className="video-status bg-[#2A2A30] p-6 rounded-lg mb-6">
            <div className="flex items-center mb-4">
              <FileVideo className="text-[#FF7A45] mr-2" size={24} />
              <h3 className="text-lg font-medium text-[#F5F5F7]">Video Processing</h3>
            </div>

            <div className="mb-4">
              <p className="text-[#F5F5F7] text-sm mb-1">File: {file.name}</p>
              <p className="text-[#A0A0A7] text-xs">
                {formatFileSize(file.size)}
              </p>
            </div>

            <ProcessingProgress
              {...mapVideoProgressToProps(
                processingProgress / 100, // Convert to 0-1 range
                processingStep,
                processingError,
                isComplete
              )}
              onRetry={handleRetry}
            />

            {/* Chunk progress indicator (only shown for large files) */}
            {chunkProgress && (
              <div className="mt-4 p-4 bg-[#1A1A1F] rounded-md">
                <h4 className="text-sm font-medium text-[#F5F5F7] mb-2">Chunk Processing</h4>
                <div className="flex justify-between text-xs text-[#A0A0A7] mb-1">
                  <span>Chunk {chunkProgress.chunkIndex + 1} of {chunkProgress.chunksTotal}</span>
                  <span>{formatFileSize(chunkProgress.bytesLoaded)} / {formatFileSize(chunkProgress.bytesTotal)}</span>
                </div>
                <div className="w-full bg-[#2A2A30] rounded-full h-2 mb-2">
                  <div 
                    className="bg-[#4299E1] h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${chunkProgress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-[#A0A0A7]">
                  Processing stage: {chunkProgress.stage}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Analysis results */}
        {analysisResult && (
          <div className="analysis-results bg-[#2A2A30] p-6 rounded-lg">
            <h3 className="text-lg font-medium text-[#F5F5F7] mb-4">Analysis Results</h3>
            <pre className="bg-[#1A1A1F] p-4 rounded overflow-auto text-[#A0A0A7] text-sm">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoProcessingTest;
